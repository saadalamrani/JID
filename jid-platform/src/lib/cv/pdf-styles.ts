/**
 * Section 6.1 — Harvard black-and-white PDF styles.
 * Times-Roman family only (built-in PDF fonts; no Font.register).
 */

import { StyleSheet } from '@react-pdf/renderer'

export const PDF_PAGE_SIZE = 'LETTER' as const

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 48,
    lineHeight: 1.25,
  },
  headerName: {
    fontFamily: 'Times-Bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerContactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  headerContact: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    textAlign: 'center',
  },
  headerContactLink: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: '#000000',
    textDecoration: 'none',
  },
  contactSeparator: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
  },
  summary: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 1.3,
  },
  sectionTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
    marginTop: 8,
    marginBottom: 4,
    paddingBottom: 1,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    flex: 1,
    paddingRight: 8,
  },
  entryDate: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    textAlign: 'right',
    flexShrink: 0,
  },
  entrySubtitle: {
    fontFamily: 'Times-Italic',
    fontSize: 11,
    marginTop: 1,
    marginBottom: 2,
  },
  entryDetail: {
    fontFamily: 'Times-Roman',
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
    fontFamily: 'Times-Roman',
    fontSize: 11,
    width: 8,
  },
  bulletText: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    flex: 1,
    lineHeight: 1.25,
  },
  skillsText: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.25,
  },
  additionalCategory: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    marginTop: 3,
    marginBottom: 1,
  },
  additionalItem: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    marginBottom: 2,
  },
  additionalLink: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: '#000000',
    textDecoration: 'none',
  },
})
