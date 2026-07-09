/**
 * Global ATS PDF styles — machine-parse-safe, single column (Prompt 1).
 */

import { StyleSheet } from '@react-pdf/renderer'

export const GLOBAL_ATS_PAGE_SIZE = 'LETTER' as const

export const globalAtsStyles = StyleSheet.create({
  page: {
    fontFamily: 'Archivo',
    fontSize: 11,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 54,
    lineHeight: 1.3,
  },
  headerName: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 4,
  },
  headerContact: {
    fontFamily: 'Archivo',
    fontSize: 10,
    marginBottom: 8,
  },
  headerContactLink: {
    fontFamily: 'Archivo',
    fontSize: 10,
    color: '#000000',
    textDecoration: 'none',
  },
  summary: {
    fontFamily: 'Archivo',
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 1.35,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 2,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryTitle: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 11,
    flex: 1,
    paddingRight: 8,
  },
  entryDate: {
    fontFamily: 'Archivo',
    fontSize: 10,
    textAlign: 'right',
    flexShrink: 0,
  },
  entrySubtitle: {
    fontFamily: 'Archivo',
    fontSize: 11,
    marginTop: 1,
    marginBottom: 2,
  },
  entryDetail: {
    fontFamily: 'Archivo',
    fontSize: 10,
    marginTop: 1,
  },
  entryBlock: {
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: 1,
    paddingLeft: 10,
  },
  bulletMarker: {
    fontFamily: 'Archivo',
    fontSize: 11,
    width: 10,
  },
  bulletText: {
    fontFamily: 'Archivo',
    fontSize: 11,
    flex: 1,
    lineHeight: 1.3,
  },
  skillsText: {
    fontFamily: 'Archivo',
    fontSize: 11,
    lineHeight: 1.3,
    marginBottom: 2,
  },
})

export const GLOBAL_ATS_SECTION_LABELS = {
  en: {
    summary: 'Professional Summary',
    experience: 'Professional Experience',
    education: 'Education',
    skills: 'Skills',
    additional: 'Additional Information',
    present: 'Present',
    gpa: 'GPA',
    languages: 'Languages',
  },
  ar: {
    summary: 'Professional Summary',
    experience: 'Professional Experience',
    education: 'Education',
    skills: 'Skills',
    additional: 'Additional Information',
    present: 'Present',
    gpa: 'GPA',
    languages: 'Languages',
  },
} as const
