// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createBusinessProfileFixture,
  createDirectoryCompany,
  createRlsUserWithRole,
  createUniversityProfileFixture,
  deleteDirectoryCompany,
  deleteRlsUser,
  type BusinessProfileFixture,
  type DirectoryCompanyFixture,
  type RlsRoleUser,
  type UniversityProfileFixture,
} from './fixtures/ownership-law'
import {
  createAnonClient,
  createAuthenticatedClient,
  createServiceRoleClient,
  getRlsTestEnv,
} from './helpers/supabase-clients'

const env = getRlsTestEnv()
const describeRls = env ? describe : describe.skip

describeRls('JID Security & Privacy Gate A', () => {
  const admin = env ? createServiceRoleClient(env) : null

  let publicUser: RlsRoleUser
  let universityGraduate: RlsRoleUser
  let otherUniversityGraduate: RlsRoleUser
  let consentOffGraduate: RlsRoleUser
  let inactiveGraduate: RlsRoleUser
  let deletedGraduate: RlsRoleUser
  let discoverableUser: RlsRoleUser
  let businessViewer: RlsRoleUser
  let universityViewerA: RlsRoleUser
  let universityViewerB: RlsRoleUser
  let mentorA: RlsRoleUser
  let mentorB: RlsRoleUser
  let mentee: RlsRoleUser
  let otherMentee: RlsRoleUser
  let businessDirectory: DirectoryCompanyFixture
  let universityDirectoryA: DirectoryCompanyFixture
  let universityDirectoryB: DirectoryCompanyFixture
  let businessProfile: BusinessProfileFixture
  let universityProfileA: UniversityProfileFixture
  let universityProfileB: UniversityProfileFixture

  const skillId = randomUUID()
  const universityCatalogA = randomUUID()
  const universityCatalogB = randomUUID()
  const emptyUniversityCatalog = randomUUID()
  const universityCodeA = `GAA${universityCatalogA.slice(0, 5)}`.toUpperCase()
  const universityCodeB = `GAB${universityCatalogB.slice(0, 5)}`.toUpperCase()
  const emptyUniversityCode = `GAE${emptyUniversityCatalog.slice(0, 5)}`.toUpperCase()
  const completedReviewMeeting = randomUUID()
  const incompleteReviewMeeting = randomUUID()
  const aggregateMeetingA = randomUUID()
  const aggregateMeetingB = randomUUID()
  const jobId = randomUUID()
  const createdReviewIds: string[] = []
  const verificationIds: string[] = []

  beforeAll(async () => {
    if (!admin) return
    ;[
      publicUser,
      universityGraduate,
      otherUniversityGraduate,
      consentOffGraduate,
      inactiveGraduate,
      deletedGraduate,
      discoverableUser,
      businessViewer,
      universityViewerA,
      universityViewerB,
      mentorA,
      mentorB,
      mentee,
      otherMentee,
    ] = await Promise.all([
      createRlsUserWithRole(admin, 'gate-a-public', 'individual'),
      createRlsUserWithRole(admin, 'gate-a-university-a-graduate', 'individual'),
      createRlsUserWithRole(admin, 'gate-a-university-b-graduate', 'individual'),
      createRlsUserWithRole(admin, 'gate-a-consent-off-graduate', 'individual'),
      createRlsUserWithRole(admin, 'gate-a-inactive-graduate', 'individual'),
      createRlsUserWithRole(admin, 'gate-a-deleted-graduate', 'individual'),
      createRlsUserWithRole(admin, 'gate-a-discoverable', 'individual'),
      createRlsUserWithRole(admin, 'gate-a-business', 'company_admin'),
      createRlsUserWithRole(admin, 'gate-a-university-a', 'university_admin'),
      createRlsUserWithRole(admin, 'gate-a-university-b', 'university_admin'),
      createRlsUserWithRole(admin, 'gate-a-mentor-a', 'individual'),
      createRlsUserWithRole(admin, 'gate-a-mentor-b', 'individual'),
      createRlsUserWithRole(admin, 'gate-a-mentee', 'individual'),
      createRlsUserWithRole(admin, 'gate-a-other-mentee', 'individual'),
    ])
    ;[businessDirectory, universityDirectoryA, universityDirectoryB] = await Promise.all([
      createDirectoryCompany(admin, 'gate-a-business'),
      createDirectoryCompany(admin, 'gate-a-university-a', 'university'),
      createDirectoryCompany(admin, 'gate-a-university-b', 'university'),
    ])

    const { error: catalogError } = await admin.from('universities_catalog').insert([
      {
        id: universityCatalogA,
        name_ar: 'Gate A University A',
        name_en: 'Gate A University A',
        short_code: universityCodeA,
        slug: `gate-a-university-a-${universityCatalogA.slice(0, 8)}`,
      },
      {
        id: universityCatalogB,
        name_ar: 'Gate A University B',
        name_en: 'Gate A University B',
        short_code: universityCodeB,
        slug: `gate-a-university-b-${universityCatalogB.slice(0, 8)}`,
      },
      {
        id: emptyUniversityCatalog,
        name_ar: 'Gate A Empty University',
        name_en: 'Gate A Empty University',
        short_code: emptyUniversityCode,
        slug: `gate-a-empty-university-${emptyUniversityCatalog.slice(0, 8)}`,
      },
    ])
    if (catalogError) throw new Error(catalogError.message)

    const [directoryLinkA, directoryLinkB] = await Promise.all([
      admin
        .from('companies')
        .update({ university_short_code: universityCodeA })
        .eq('id', universityDirectoryA.id),
      admin
        .from('companies')
        .update({ university_short_code: universityCodeB })
        .eq('id', universityDirectoryB.id),
    ])
    if (directoryLinkA.error) throw new Error(directoryLinkA.error.message)
    if (directoryLinkB.error) throw new Error(directoryLinkB.error.message)
    ;[businessProfile, universityProfileA, universityProfileB] = await Promise.all([
      createBusinessProfileFixture(
        admin,
        businessViewer.id,
        businessDirectory.id,
        'gate-a-business',
      ),
      createUniversityProfileFixture(
        admin,
        universityViewerA.id,
        universityDirectoryA.id,
        'gate-a-university-a',
      ),
      createUniversityProfileFixture(
        admin,
        universityViewerB.id,
        universityDirectoryB.id,
        'gate-a-university-b',
      ),
    ])

    const verificationRows = [
      {
        id: randomUUID(),
        applicant_user_id: businessViewer.id,
        directory_id: businessDirectory.id,
        company_name: businessDirectory.name,
        business_email: `security@${businessDirectory.domain}`,
        claimant_name: 'Gate A Business Owner',
        verification_type: 'business',
        status: 'approved',
        evidence_urls: [],
        resulting_profile_id: businessProfile.id,
        resulting_profile_type: 'business',
      },
      {
        id: randomUUID(),
        applicant_user_id: universityViewerA.id,
        directory_id: universityDirectoryA.id,
        company_name: universityDirectoryA.name,
        business_email: `security@${universityDirectoryA.domain}`,
        claimant_name: 'Gate A University A Owner',
        verification_type: 'university',
        status: 'approved',
        evidence_urls: [],
        resulting_profile_id: universityProfileA.id,
        resulting_profile_type: 'university',
      },
      {
        id: randomUUID(),
        applicant_user_id: universityViewerB.id,
        directory_id: universityDirectoryB.id,
        company_name: universityDirectoryB.name,
        business_email: `security@${universityDirectoryB.domain}`,
        claimant_name: 'Gate A University B Owner',
        verification_type: 'university',
        status: 'approved',
        evidence_urls: [],
        resulting_profile_id: universityProfileB.id,
        resulting_profile_type: 'university',
      },
    ]
    verificationIds.push(...verificationRows.map((row) => row.id))
    const { error: verificationError } = await admin
      .from('verification_requests')
      .insert(verificationRows)
    if (verificationError) throw new Error(verificationError.message)

    const profileUpdates = await Promise.all([
      admin
        .from('profiles')
        .update({
          full_name: 'Gate A Public',
          profile_state: 'active',
          visibility: 'public',
          show_profile_to_companies: false,
        })
        .eq('id', publicUser.id)
        .select('id'),
      admin
        .from('profiles')
        .update({
          full_name: 'Gate A University A Graduate',
          profile_state: 'active',
          visibility: 'private',
          show_profile_in_university_stats: true,
          university_id: universityCatalogA,
          profile_completion_pct: 80,
        })
        .eq('id', universityGraduate.id)
        .select('id'),
      admin
        .from('profiles')
        .update({
          full_name: 'Gate A University B Graduate',
          profile_state: 'active',
          visibility: 'private',
          show_profile_in_university_stats: true,
          university_id: universityCatalogB,
          profile_completion_pct: 60,
        })
        .eq('id', otherUniversityGraduate.id)
        .select('id'),
      admin
        .from('profiles')
        .update({
          full_name: 'Gate A Consent Off Graduate',
          profile_state: 'active',
          visibility: 'private',
          show_profile_in_university_stats: false,
          university_id: universityCatalogA,
          profile_completion_pct: 100,
        })
        .eq('id', consentOffGraduate.id)
        .select('id'),
      admin
        .from('profiles')
        .update({
          full_name: 'Gate A Inactive Graduate',
          profile_state: 'incomplete',
          visibility: 'private',
          show_profile_in_university_stats: true,
          university_id: universityCatalogA,
          profile_completion_pct: 100,
        })
        .eq('id', inactiveGraduate.id)
        .select('id'),
      admin
        .from('profiles')
        .update({
          full_name: 'Gate A Deleted Graduate',
          profile_state: 'deleted',
          deleted_at: new Date().toISOString(),
          visibility: 'private',
          show_profile_in_university_stats: true,
          university_id: universityCatalogA,
          profile_completion_pct: 100,
        })
        .eq('id', deletedGraduate.id)
        .select('id'),
      admin
        .from('profiles')
        .update({
          full_name: 'Gate A Discoverable',
          profile_state: 'active',
          visibility: 'discoverable',
          show_profile_to_companies: true,
        })
        .eq('id', discoverableUser.id)
        .select('id'),
    ])
    for (const profileUpdate of profileUpdates) {
      if (profileUpdate.error) throw new Error(profileUpdate.error.message)
      if (profileUpdate.data?.length !== 1) {
        throw new Error('Gate A profile fixture update affected no row')
      }
    }

    const { data: profileEvidence, error: profileEvidenceError } = await admin
      .from('profiles')
      .select(
        'id, visibility, show_profile_to_companies, show_profile_in_university_stats, university_id',
      )
      .in('id', [
        publicUser.id,
        universityGraduate.id,
        otherUniversityGraduate.id,
        consentOffGraduate.id,
        inactiveGraduate.id,
        deletedGraduate.id,
        discoverableUser.id,
      ])
    if (profileEvidenceError) throw new Error(profileEvidenceError.message)
    if (profileEvidence?.length !== 7) {
      throw new Error(`Gate A profile fixture evidence missing: ${JSON.stringify(profileEvidence)}`)
    }

    const { error: skillError } = await admin.from('skills').insert({
      id: skillId,
      name: 'Gate A Skill',
      name_ar: 'Gate A Skill',
    })
    if (skillError) throw new Error(skillError.message)

    const { error: profileSkillError } = await admin.from('profile_skills').insert([
      { profile_id: publicUser.id, skill_id: skillId },
      { profile_id: universityGraduate.id, skill_id: skillId },
      { profile_id: discoverableUser.id, skill_id: skillId },
    ])
    if (profileSkillError) throw new Error(profileSkillError.message)

    // The production completion trigger deliberately recalculates profile_state
    // after skill changes. These fixtures model published active profiles without
    // manufacturing every unrelated completion input, so restore that state only
    // after all completion-triggering setup has finished.
    const { data: activatedProfiles, error: activationError } = await admin
      .from('profiles')
      .update({ profile_state: 'active' })
      .in('id', [
        publicUser.id,
        universityGraduate.id,
        otherUniversityGraduate.id,
        discoverableUser.id,
      ])
      .select('id')
    if (activationError) throw new Error(activationError.message)
    if (activatedProfiles?.length !== 4) {
      throw new Error('Gate A profile fixture activation affected an unexpected row count')
    }

    const { error: mentorError } = await admin.from('mentor_profiles').insert([
      {
        user_id: mentorA.id,
        status: 'approved',
        slug: `gate-a-mentor-a-${mentorA.id.slice(0, 8)}`,
        headline: 'Gate A Mentor A',
        application_message: 'INTERNAL_APPLICATION_MESSAGE',
        rejection_reason: 'INTERNAL_REJECTION_REASON',
      },
      {
        user_id: mentorB.id,
        status: 'approved',
        slug: `gate-a-mentor-b-${mentorB.id.slice(0, 8)}`,
        headline: 'Gate A Mentor B',
      },
    ])
    if (mentorError) throw new Error(mentorError.message)

    const { error: meetingError } = await admin.from('mentorship_meetings').insert([
      {
        id: completedReviewMeeting,
        mentor_id: mentorA.id,
        mentee_id: mentee.id,
        status: 'completed',
      },
      {
        id: incompleteReviewMeeting,
        mentor_id: mentorA.id,
        mentee_id: mentee.id,
        status: 'confirmed',
      },
      {
        id: aggregateMeetingA,
        mentor_id: mentorA.id,
        mentee_id: universityGraduate.id,
        status: 'completed',
      },
      {
        id: aggregateMeetingB,
        mentor_id: mentorB.id,
        mentee_id: universityGraduate.id,
        status: 'completed',
      },
    ])
    if (meetingError) throw new Error(meetingError.message)

    const { error: cvError } = await admin.from('cvs').insert([
      { user_id: universityGraduate.id, is_primary: true },
      { user_id: universityGraduate.id, is_primary: false },
    ])
    if (cvError) throw new Error(cvError.message)

    const { error: jobError } = await admin.from('jobs').insert({
      id: jobId,
      business_profile_id: businessProfile.id,
      company_id: businessDirectory.id,
      created_by: businessViewer.id,
      title_ar: 'Gate A Opportunity',
      status: 'published',
    })
    if (jobError) throw new Error(jobError.message)

    const { error: applicationError } = await admin.from('applications').insert([
      { applicant_id: universityGraduate.id, job_id: jobId, status: 'saved' },
      { applicant_id: universityGraduate.id, job_id: jobId, status: 'saved' },
    ])
    if (applicationError) throw new Error(applicationError.message)

    const { error: refreshError } = await admin.rpc('refresh_university_dashboard_snapshot')
    if (refreshError) throw new Error(refreshError.message)
  })

  afterAll(async () => {
    if (!admin) return

    await admin.from('mentor_reviews').delete().in('id', createdReviewIds)
    if (universityGraduate?.id) {
      await admin.from('applications').delete().eq('applicant_id', universityGraduate.id)
      await admin.from('cvs').delete().eq('user_id', universityGraduate.id)
    }
    await admin.from('jobs').delete().eq('id', jobId)
    if (verificationIds.length > 0) {
      await admin.from('verification_requests').delete().in('id', verificationIds)
    }
    await admin
      .from('mentorship_meetings')
      .delete()
      .in('id', [
        completedReviewMeeting,
        incompleteReviewMeeting,
        aggregateMeetingA,
        aggregateMeetingB,
      ])
    const mentorIds = [mentorA?.id, mentorB?.id].filter((id): id is string => Boolean(id))
    if (mentorIds.length > 0) {
      await admin.from('mentor_profiles').delete().in('user_id', mentorIds)
    }
    const businessProfileIds = [businessProfile?.id].filter((id): id is string => Boolean(id))
    if (businessProfileIds.length > 0) {
      await admin.from('business_profiles').delete().in('id', businessProfileIds)
    }
    const universityProfileIds = [universityProfileA?.id, universityProfileB?.id].filter(
      (id): id is string => Boolean(id),
    )
    if (universityProfileIds.length > 0) {
      await admin.from('university_profiles').delete().in('id', universityProfileIds)
    }
    await admin.from('profile_skills').delete().eq('skill_id', skillId)
    await admin.from('skills').delete().eq('id', skillId)

    for (const user of [
      otherMentee,
      mentee,
      mentorB,
      mentorA,
      universityViewerB,
      universityViewerA,
      businessViewer,
      discoverableUser,
      deletedGraduate,
      inactiveGraduate,
      consentOffGraduate,
      otherUniversityGraduate,
      universityGraduate,
      publicUser,
    ]) {
      if (user?.id) await deleteRlsUser(admin, user.id)
    }

    for (const directory of [businessDirectory, universityDirectoryA, universityDirectoryB]) {
      if (directory?.id) await deleteDirectoryCompany(admin, directory.id)
    }

    await admin
      .from('universities_catalog')
      .delete()
      .in('id', [universityCatalogA, universityCatalogB, emptyUniversityCatalog])
  })

  it('exposes public skills but denies private skill mappings to anon', async () => {
    const anon = createAnonClient(env!)
    const { data, error } = await anon
      .from('profile_skills')
      .select('profile_id')
      .in('profile_id', [publicUser.id, universityGraduate.id])

    expect(error).toBeNull()
    expect(data).toEqual([{ profile_id: publicUser.id }])
  })

  it('preserves owner skill reads while denying unrelated authenticated users', async () => {
    const owner = await createAuthenticatedClient(
      env!,
      universityGraduate.email,
      universityGraduate.password,
    )
    const unrelated = await createAuthenticatedClient(env!, otherMentee.email, otherMentee.password)

    const ownerResult = await owner
      .from('profile_skills')
      .select('profile_id')
      .eq('profile_id', universityGraduate.id)
    const unrelatedResult = await unrelated
      .from('profile_skills')
      .select('profile_id')
      .eq('profile_id', universityGraduate.id)

    expect(ownerResult.error).toBeNull()
    expect(ownerResult.data).toEqual([{ profile_id: universityGraduate.id }])
    expect(unrelatedResult.error).toBeNull()
    expect(unrelatedResult.data).toEqual([])
  })

  it('lets a verified business use only the safe discoverable projection', async () => {
    const business = await createAuthenticatedClient(
      env!,
      businessViewer.email,
      businessViewer.password,
    )

    const base = await business
      .from('profiles')
      .select('id, last_login_ip')
      .eq('id', discoverableUser.id)
      .maybeSingle()
    const projection = await business
      .from('individual_profile_public_projection')
      .select('id, full_name')
      .eq('id', discoverableUser.id)
      .maybeSingle()

    // Professional Discovery fail-closed: consent alone does not grant Business reads.
    expect(base.error).toBeNull()
    expect(base.data).toBeNull()
    expect(projection.error).toBeNull()
    expect(projection.data).toBeNull()
  })

  it('does not give a university individual-row access to either university cohort', async () => {
    const university = await createAuthenticatedClient(
      env!,
      universityViewerA.email,
      universityViewerA.password,
    )

    const base = await university
      .from('profiles')
      .select('id')
      .in('id', [universityGraduate.id, otherUniversityGraduate.id])
    const projection = await university
      .from('individual_profile_public_projection')
      .select('id')
      .in('id', [universityGraduate.id, otherUniversityGraduate.id])

    expect(base.error).toBeNull()
    expect(base.data).toEqual([])
    expect(projection.error).toBeNull()
    expect(projection.data).toEqual([])
  })

  it('fails closed for University owners until Directory and catalog identities are reconciled', async () => {
    const university = await createAuthenticatedClient(
      env!,
      universityViewerA.email,
      universityViewerA.password,
    )
    const { data, error } = await university
      .from('university_dashboard_view')
      .select(
        'university_id, total_students, cv_creation_pct, job_applications, mentorship_sessions',
      )

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('computes internal consent-safe aggregates without fan-out multiplication', async () => {
    const { data, error } = await admin!
      .from('university_dashboard_snapshot')
      .select('university_id, total_students, cv_creation_pct, job_applications, mentorship_sessions')
      .eq('university_id', universityCatalogA)
      .single()

    expect(error).toBeNull()
    expect(data).toEqual({
      university_id: universityCatalogA,
      total_students: 1,
      cv_creation_pct: 100,
      job_applications: 2,
      mentorship_sessions: 2,
    })
  })

  it('excludes consent-off, inactive, and deleted profiles from university statistics', async () => {
    const { data, error } = await admin!
      .from('university_dashboard_snapshot')
      .select('university_id, total_students')
      .eq('university_id', universityCatalogA)
      .single()

    expect(error).toBeNull()
    expect(data).toEqual({ university_id: universityCatalogA, total_students: 1 })
  })

  it('omits a university snapshot row when no consented active population exists', async () => {
    const { data, error } = await admin!
      .from('university_dashboard_snapshot')
      .select('university_id')
      .eq('university_id', emptyUniversityCatalog)

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('allows only the meeting mentee to review the matching mentor after completion', async () => {
    const client = await createAuthenticatedClient(env!, mentee.email, mentee.password)
    const { data, error } = await client
      .from('mentor_reviews')
      .insert({
        meeting_id: completedReviewMeeting,
        mentor_id: mentorA.id,
        reviewer_id: mentee.id,
        rating: 5,
        review_text: 'Valid completed-session review',
        visibility: 'public_named',
      })
      .select('id')
      .single()

    expect(error).toBeNull()
    expect(data?.id).toBeTruthy()
    if (data?.id) createdReviewIds.push(data.id)
  })

  it('denies a review whose mentor differs from the completed meeting mentor', async () => {
    const client = await createAuthenticatedClient(env!, mentee.email, mentee.password)
    const { error } = await client.from('mentor_reviews').insert({
      meeting_id: completedReviewMeeting,
      mentor_id: mentorB.id,
      reviewer_id: mentee.id,
      rating: 5,
      visibility: 'private',
    })

    expect(error).not.toBeNull()
  })

  it('denies a reviewer who is not the meeting mentee', async () => {
    const client = await createAuthenticatedClient(env!, otherMentee.email, otherMentee.password)
    const { error } = await client.from('mentor_reviews').insert({
      meeting_id: completedReviewMeeting,
      mentor_id: mentorA.id,
      reviewer_id: otherMentee.id,
      rating: 4,
      visibility: 'private',
    })

    expect(error).not.toBeNull()
  })

  it('denies a review before the meeting is completed', async () => {
    const client = await createAuthenticatedClient(env!, mentee.email, mentee.password)
    const { error } = await client.from('mentor_reviews').insert({
      meeting_id: incompleteReviewMeeting,
      mentor_id: mentorA.id,
      reviewer_id: mentee.id,
      rating: 4,
      visibility: 'private',
    })

    expect(error).not.toBeNull()
  })

  it('exposes mentor and review public projections without internal columns', async () => {
    const anon = createAnonClient(env!)
    const baseMentor = await anon
      .from('mentor_profiles')
      .select('user_id, application_message')
      .eq('user_id', mentorA.id)
    const publicMentor = await anon
      .from('mentor_public_projection')
      .select('user_id, full_name, headline')
      .eq('user_id', mentorA.id)
      .single()
    const internalColumnAttempt = await anon
      .from('mentor_public_projection')
      .select('application_message')

    expect(baseMentor.error?.code).toBe('42501')
    expect(publicMentor.error).toBeNull()
    expect(publicMentor.data?.user_id).toBe(mentorA.id)
    expect(internalColumnAttempt.error).not.toBeNull()

    const baseReviews = await anon
      .from('mentor_reviews')
      .select('id, meeting_id')
      .eq('mentor_id', mentorA.id)
    const publicReviews = await anon
      .from('mentor_review_public_projection')
      .select('id, mentor_id, reviewer_name')
      .eq('mentor_id', mentorA.id)

    expect(baseReviews.error?.code).toBe('42501')
    expect(publicReviews.error).toBeNull()
    expect(publicReviews.data).toHaveLength(1)
    expect(publicReviews.data?.[0]?.reviewer_name).toBe('RLS gate-a-mentee')
  })

  it('revokes anon access to the profiles base table while preserving the safe projection', async () => {
    const anon = createAnonClient(env!)
    const base = await anon.from('profiles').select('id').eq('id', publicUser.id)
    const projection = await anon
      .from('individual_profile_public_projection')
      .select('id, full_name')
      .eq('id', publicUser.id)
      .single()

    expect(base.error?.code).toBe('42501')
    expect(projection.error).toBeNull()
    expect(projection.data?.id).toBe(publicUser.id)
  })

  it('contains application rows to the applicant and owning Business RLS contracts', async () => {
    const anon = createAnonClient(env!)
    const applicant = await createAuthenticatedClient(
      env!,
      universityGraduate.email,
      universityGraduate.password,
    )
    const business = await createAuthenticatedClient(
      env!,
      businessViewer.email,
      businessViewer.password,
    )
    const unrelated = await createAuthenticatedClient(env!, otherMentee.email, otherMentee.password)

    const anonRead = await anon.from('applications').select('id').eq('job_id', jobId)
    const applicantRead = await applicant
      .from('applications')
      .select('id, resume_url, cover_letter, contact_email')
      .eq('job_id', jobId)
    const businessRead = await business.from('applications').select('id').eq('job_id', jobId)
    const unrelatedRead = await unrelated.from('applications').select('id').eq('job_id', jobId)
    const unrelatedDelete = await unrelated.from('applications').delete().eq('job_id', jobId)

    expect(anonRead.error?.code).toBe('42501')
    expect(applicantRead.error).toBeNull()
    expect(applicantRead.data).toHaveLength(2)
    expect(businessRead.error).toBeNull()
    expect(businessRead.data).toHaveLength(2)
    expect(unrelatedRead.error).toBeNull()
    expect(unrelatedRead.data).toEqual([])
    expect(unrelatedDelete.error?.code).toBe('42501')
  })
})
