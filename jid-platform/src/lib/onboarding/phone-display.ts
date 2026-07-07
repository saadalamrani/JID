/** Display E.164 Saudi phone in the national input field (+966 stripped). */
export function phoneToNationalInput(phone: string | null | undefined): string {
  if (!phone) return ''
  return phone.replace(/^\+966/, '')
}
