export { CAREER_RECORD_CORE_OPERATIONS, type CareerRecordPort } from './operations'
export {
  boundCareerRecordPort,
  resolveCareerRecordPort,
  unavailableCareerRecordPort,
} from './port'
export { getCareerRecordCopy, careerRecordCopy } from './copy'
export { CareerRecordView } from './components/career-record-view'
export { CareerRecordRoute } from './career-record-route'
export { CareerRecordEntryLinks } from './components/career-record-entry-links'
export { CareerEvidenceInspector } from './components/career-evidence-inspector'
export { CareerEvidenceFormDialog } from './components/career-evidence-form-dialog'
export {
  evidenceImpliesRecipientAccess,
  isPrivateByDefault,
  presentEvidencePrivacy,
  verificationImpliesPublicVisibility,
  cvSelectionImpliesPublicVisibility,
} from './privacy'
export { careerEvidenceDisplay, groupCareerEvidenceByCategory } from './fact-display'
