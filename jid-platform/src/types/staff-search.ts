export type StaffSearchUserResult = {
  id: string
  label: string
  subtitle: string
  href: string
}

export type StaffSearchEntityResult = {
  id: string
  label: string
  subtitle: string
  href: string
}

export type StaffSearchClaimResult = {
  id: string
  label: string
  subtitle: string
  href: string
}

/** Section 12 — bounded staff search response (grouped). */
export type StaffSearchResponse = {
  users: StaffSearchUserResult[]
  entities: StaffSearchEntityResult[]
  claims: StaffSearchClaimResult[]
}
