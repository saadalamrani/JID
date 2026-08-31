/**
 * Resolve Vercel Preview protection-bypass for Wave 9 runtime proof.
 * Prints metadata only — never prints the secret.
 * Writes secret to gitignored .vercel/wave9-preview.env
 */
const fs = require('fs')
const path = require('path')

const PROJECT_ID = 'prj_j1ldG4jSxHiNaVbDaY3036zJ0AHR'
const TEAM_ID = 'team_GA06Rp5g2uEFY3EYmuwuLacG'
const DEPLOYMENT_ID = 'dpl_KdRi1fhpPqXWMvHw4A3Bc6swhUjr'

function readToken() {
  const candidates = [
    path.join(process.env.APPDATA || '', 'com.vercel.cli', 'Data', 'auth.json'),
    path.join(process.env.APPDATA || '', 'xdg.data', 'com.vercel.cli', 'auth.json'),
  ]
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue
    const json = JSON.parse(fs.readFileSync(file, 'utf8'))
    const token = json.token || json.accessToken || json.authToken
    if (token) return token
  }
  throw new Error('vercel auth token not found')
}

async function api(pathname, init = {}) {
  const token = readToken()
  const url = pathname.startsWith('http')
    ? pathname
    : `https://api.vercel.com${pathname}${pathname.includes('?') ? '&' : '?'}teamId=${TEAM_ID}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const text = await response.text()
  let body = null
  try {
    body = JSON.parse(text)
  } catch {
    body = { raw: text.slice(0, 200) }
  }
  if (!response.ok) {
    throw new Error(`vercel ${response.status} ${pathname}: ${JSON.stringify({ keys: Object.keys(body || {}) })}`)
  }
  return body
}

async function main() {
  const deployment = await api(`/v13/deployments/${DEPLOYMENT_ID}`)
  const git = deployment.meta || {}
  process.stdout.write(
    JSON.stringify(
      {
        url: deployment.url,
        readyState: deployment.readyState,
        target: deployment.target,
        gitCommit: git.githubCommitSha || git.gitCommitSha || deployment.source?.sha || null,
        gitRef: git.githubCommitRef || git.gitBranch || null,
        projectKeys: undefined,
      },
      null,
      2,
    ) + '\n',
  )

  const project = await api(`/v9/projects/${PROJECT_ID}`)
  const protectionKeys = Object.keys(project).filter((key) =>
    /protect|sso|bypass|share/i.test(key),
  )
  process.stdout.write(
    JSON.stringify(
      {
        projectName: project.name,
        protectionKeys,
        hasBypassObject: Boolean(project.protectionBypass),
        ssoProtection: project.ssoProtection || null,
        passwordProtection: Boolean(project.passwordProtection),
      },
      null,
      2,
    ) + '\n',
  )

  let secret = null
  if (project.protectionBypass && typeof project.protectionBypass === 'object') {
    const keys = Object.keys(project.protectionBypass)
    process.stdout.write('bypass_key_count=' + keys.length + '\n')
    secret = keys[0] || null
  }

  if (!secret) throw new Error('could not resolve protection bypass secret')

  const outDir = path.resolve(__dirname, '..', '.vercel')
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, 'wave9-preview.env')
  fs.writeFileSync(
    outFile,
      `PLAYWRIGHT_BASE_URL=https://jid-q97hqewma-jidplatform.vercel.app\nVERCEL_AUTOMATION_BYPASS_SECRET=${secret}\n`,
    { encoding: 'utf8' },
  )
  process.stdout.write('bypass_written=true\n')
}

main().catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n')
  process.exit(1)
})
