'use server'

import { revalidatePath } from 'next/cache'
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from '@/app/[locale]/(staff)/staff/announcements/actions'
import type { AnnouncementInput } from '@/types/announcement'

export async function createAdminAnnouncement(input: AnnouncementInput) {
  const result = await createAnnouncement(input)
  revalidatePath('/admin/announcements')
  revalidatePath('/admin/announcements/new')
  return result
}

export async function updateAdminAnnouncement(id: string, input: AnnouncementInput) {
  const result = await updateAnnouncement(id, input)
  revalidatePath('/admin/announcements')
  revalidatePath(`/admin/announcements/${id}/edit`)
  return result
}

export async function deleteAdminAnnouncement(id: string) {
  const result = await deleteAnnouncement(id)
  revalidatePath('/admin/announcements')
  return result
}
