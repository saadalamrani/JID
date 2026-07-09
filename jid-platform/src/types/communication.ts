import type { CommKind } from '@/lib/constants/communication'
import type { ApplicationStatus } from '@/types/application'

export type CascadeSuggestion = {
  suggestionKind: CommKind
  targetStatus: ApplicationStatus
  recipientIds: string[]
  recipientCount: number
}

export type CommunicationBatch = {
  id: string
  companyId: string
  jobId: string
  kind: CommKind
  recipientApplicationIds: string[]
  recipientCount: number
  templateSnapshot: {
    kind: CommKind
    subject_ar: string
    body_ar: string
  }
  status: 'pending_confirmation' | 'scheduled' | 'sending' | 'sent' | 'canceled' | 'failed'
  scheduledSendAt: string | null
  sentCount: number
  failedCount: number
  createdAt: string
}

export type CommunicationTemplate = {
  id: string
  companyId: string
  kind: CommKind
  subjectAr: string
  bodyAr: string
  isLocked: boolean
  updatedAt: string
}

export type CommunicationLogEntry = {
  id: string
  applicationId: string
  kind: CommKind
  status: string
  sentAt: string
}
