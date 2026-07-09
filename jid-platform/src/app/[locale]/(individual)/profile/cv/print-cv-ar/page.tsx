import { PrintCvArView } from './print-cv-ar-view'

export const metadata = {
  title: 'طباعة السيرة',
  robots: 'noindex, nofollow',
}

/** Client-only AR print surface — CV data from sessionStorage, never server-rendered content. */
export default function PrintCvArPage() {
  return <PrintCvArView />
}
