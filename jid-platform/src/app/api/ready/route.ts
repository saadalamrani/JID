import { COMMERCIAL_PACKAGES, assertPackagingInvariants } from '@/lib/commercial/contracts'

export function GET() {
  try {
    assertPackagingInvariants(COMMERCIAL_PACKAGES)
  } catch {
    return Response.json(
      {
        ok: false,
        timezone: 'Asia/Riyadh',
        checks: { packaging_contract: false, liveness: true },
      },
      { status: 503 },
    )
  }

  return Response.json({
    ok: true,
    timezone: 'Asia/Riyadh',
    checks: {
      liveness: true,
      packaging_contract: true,
      public_price_adopted: false,
    },
  })
}
