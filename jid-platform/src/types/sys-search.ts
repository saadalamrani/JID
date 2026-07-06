export type SysSearchUserResult = {
  id: string
  label: string
  subtitle: string
  href: string
}

export type SysSearchEntityResult = {
  id: string
  label: string
  subtitle: string
  href: string
}

export type SysSearchResponse = {
  users: SysSearchUserResult[]
  entities: SysSearchEntityResult[]
}
