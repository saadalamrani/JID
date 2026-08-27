import type { CareerEvidenceSourceClass } from '@/types/contracts'
import type { CareerRecordCopy } from './copy'

export function sourceExplanation(
  sourceClass: CareerEvidenceSourceClass,
  copy: CareerRecordCopy,
): string {
  switch (sourceClass) {
    case 'SELF_DECLARED':
      return copy.sourceSelfDeclared
    case 'ISSUER_VERIFIED':
      return copy.sourceIssuer
    case 'ORGANIZATION_CONFIRMED':
      return copy.sourceOrganization
    case 'SYSTEM_OBSERVED':
      return copy.sourceObserved
    case 'THIRD_PARTY_SOURCED':
      return copy.sourceThirdParty
    case 'DERIVED_EXPLAINABLE':
      return copy.sourceDerived
  }
}
