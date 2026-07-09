/**
 * Harvard format PDF styles (Prompt 1) — Archivo, strict B&W, 1.9–2.5cm margins.
 */

import { StyleSheet } from '@react-pdf/renderer'

/** ~2.2cm horizontal / 1.9cm vertical on Letter */
export const HARVARD_PAGE_SIZE = 'LETTER' as const

export const HARVARD_MIN_FONT_SIZE = 10

export const harvardStyles = StyleSheet.create({
  page: {
    fontFamily: 'Archivo',
    fontSize: 11,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    paddingTop: 54,
    paddingBottom: 54,
    paddingHorizontal: 62,
    lineHeight: 1.25,
  },
  headerName: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  headerContactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  headerContact: {
    fontFamily: 'Archivo',
    fontSize: 10,
    textAlign: 'center',
  },
  headerContactLink: {
    fontFamily: 'Archivo',
    fontSize: 10,
    color: '#000000',
    textDecoration: 'none',
  },
  contactSeparator: {
    fontFamily: 'Archivo',
    fontSize: 10,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase',
    borderBottomWidth: 0.75,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
    marginTop: 8,
    marginBottom: 4,
    paddingBottom: 2,
    letterSpacing: 0.4,
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
    fontSize: 11,
    textAlign: 'right',
    flexShrink: 0,
  },
  entrySubtitle: {
    fontFamily: 'Archivo',
    fontStyle: 'italic',
    fontSize: 11,
    marginTop: 1,
    marginBottom: 2,
  },
  entryDetail: {
    fontFamily: 'Archivo',
    fontSize: 11,
    marginTop: 1,
  },
  entryBlock: {
    marginBottom: 5,
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: 1,
    paddingLeft: 8,
  },
  bulletMarker: {
    fontFamily: 'Archivo',
    fontSize: 11,
    width: 8,
  },
  bulletText: {
    fontFamily: 'Archivo',
    fontSize: 11,
    flex: 1,
    lineHeight: 1.25,
  },
  skillsLine: {
    fontFamily: 'Archivo',
    fontSize: 11,
    lineHeight: 1.25,
    marginBottom: 2,
  },
  skillsLabel: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 11,
  },
  additionalItem: {
    fontFamily: 'Archivo',
    fontSize: 11,
    marginBottom: 2,
  },
  additionalLink: {
    fontFamily: 'Archivo',
    fontSize: 11,
    color: '#000000',
    textDecoration: 'none',
  },
})

export const HARVARD_SECTION_LABELS = {
  en: {
    education: 'Education',
    experience: 'Experience',
    leadership: 'Leadership & Activities',
    skillsInterests: 'Skills & Interests',
    present: 'Present',
    gpa: 'GPA',
    technical: 'Technical',
    languages: 'Languages',
    interests: 'Interests',
  },
  ar: {
    education: 'Education',
    experience: 'Experience',
    leadership: 'Leadership & Activities',
    skillsInterests: 'Skills & Interests',
    present: 'Present',
    gpa: 'GPA',
    technical: 'Technical',
    languages: 'Languages',
    interests: 'Interests',
  },
} as const
