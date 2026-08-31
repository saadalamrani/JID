export type UpdateKind = 'project' | 'achievement' | 'learning' | 'credential' | 'career'
export type Audience = 'connections' | 'private'
export type NetworkPerson = { id: string; profileId: string; name: string; headline: string | null }
export type NetworkUpdate = {
  id: string
  authorId: string
  authorName: string
  kind: UpdateKind
  body: string
  audience: Audience
  createdAt: string
  isOwner: boolean
}
export type NetworkSnapshot = {
  preferences: { acceptsConnections: boolean; updatesEnabled: boolean; defaultAudience: Audience }
  connections: NetworkPerson[]
  incoming: NetworkPerson[]
  updates: NetworkUpdate[]
}
