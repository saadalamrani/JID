export const SHARED_CONTRACT_VERSION = '1.0' as const

export type SharedContractVersion = typeof SHARED_CONTRACT_VERSION
export type ContractId = string
export type IsoTimestamp = string
export type LocaleCode = string

export type VersionedContract = {
  contract_version: SharedContractVersion
}

export type ContractReference = {
  id: ContractId
  version?: string
}
