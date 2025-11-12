import { NextRequest, NextResponse } from 'next/server'
import { fromAts, fromCore } from '@/lib/db/schema-helpers'
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'

/**
 * GET /api/recruitment/dashboard/stats
 * Fetch comprehensive dashboard statistics for recruitment
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)

    // ========== CORE KPIs ==========

    // Total candidates with breakdown by status
    const { data: allCandidates, count: totalCandidates } = await fromAts('candidates')
      .select('id, status, created_at, updated_at')
      .is('deleted_at', null)

    const candidatesByStatus: Record<string, number> = {}
    const candidatesTyped = (allCandidates || []) as any[]
    candidatesTyped.forEach((c: any) => {
      candidatesByStatus[c.status] = (candidatesByStatus[c.status] || 0) + 1
    })

    // Active applications (not rejected, withdrawn, or accepted)
    const { count: activeApplications } = await fromAts('applications')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .not('status', 'in', '(rejected,withdrawn,accepted)')

    // Upcoming interviews (next 7 days)
    const { count: upcomingInterviews } = await fromAts('interviews')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', sevenDaysFromNow.toISOString())

    // Open positions (active job_listings)
    const { count: openPositions } = await fromAts('job_listings')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'active')

    // Hired this month
    const { count: hiredThisMonth } = await fromAts('candidates')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'hired')
      .gte('updated_at', currentMonthStart.toISOString())
      .lte('updated_at', currentMonthEnd.toISOString())

    // Offers pending
    const { count: offersPending } = await fromAts('candidates')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'offered')

    // Time to fill calculation
    const { data: hiredCandidates } = await fromAts('candidates')
      .select('id, updated_at, created_at')
      .is('deleted_at', null)
      .eq('status', 'hired')
      .gte('updated_at', thirtyDaysAgo.toISOString())

    // Get job listings for hired candidates to calculate time to fill
    const { data: allApplications } = await fromAts('applications')
      .select('id, candidate_id, job_listing_id, created_at')
      .is('deleted_at', null)

    const { data: allJobListings } = await fromAts('job_listings')
      .select('id, posted_at')
      .is('deleted_at', null)

    const jobListingsMap = new Map((allJobListings || []).map((j: any) => [j.id, j]))
    const applicationsMap = new Map((allApplications || []).map((a: any) => [a.candidate_id, a]))

    let totalTimeToFill = 0
    let timeToFillCount = 0
    const hiredCandidatesTyped = (hiredCandidates || []) as any[]
    hiredCandidatesTyped.forEach((candidate: any) => {
      const application = applicationsMap.get(candidate.id)
      if (application?.job_listing_id) {
        const jobListing = jobListingsMap.get(application.job_listing_id)
        if (jobListing?.posted_at) {
          const postedDate = new Date(jobListing.posted_at)
          const hiredDate = new Date(candidate.updated_at)
          const daysDiff = Math.ceil((hiredDate.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24))
          if (daysDiff > 0) {
            totalTimeToFill += daysDiff
            timeToFillCount++
          }
        }
      }
    })
    const averageTimeToFill = timeToFillCount > 0 ? Math.round(totalTimeToFill / timeToFillCount) : 0

    // Offer acceptance rate
    const { count: totalOffered } = await fromAts('candidates')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .in('status', ['offered', 'hired'])
    const offerAcceptanceRate = totalOffered && totalOffered > 0
      ? Math.round(((hiredCandidatesTyped.length || 0) / totalOffered) * 100)
      : 0

    // ========== TREND DATA (Last 30 days) ==========

    const daysToShow = 30
    const trendStart = subDays(now, daysToShow - 1)

    // Applications trend
    const { data: allApplicationsTrend } = await fromAts('applications')
      .select('created_at')
      .is('deleted_at', null)
      .gte('created_at', startOfDay(trendStart).toISOString())
      .lte('created_at', endOfDay(now).toISOString())

    // Interviews scheduled trend
    const { data: allInterviewsTrend } = await fromAts('interviews')
      .select('scheduled_at, created_at')
      .is('deleted_at', null)
      .gte('created_at', startOfDay(trendStart).toISOString())
      .lte('created_at', endOfDay(now).toISOString())

    // Hires trend
    const { data: allHiresTrend } = await fromAts('candidates')
      .select('updated_at')
      .is('deleted_at', null)
      .eq('status', 'hired')
      .gte('updated_at', startOfDay(trendStart).toISOString())
      .lte('updated_at', endOfDay(now).toISOString())

    // Group trend data by date
    const applicationsTrend: Array<{ date: string; count: number }> = []
    const interviewsTrend: Array<{ date: string; count: number }> = []
    const hiresTrend: Array<{ date: string; count: number }> = []

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(now, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayStart = startOfDay(date).getTime()
      const dayEnd = endOfDay(date).getTime()

      const dayApplications = ((allApplicationsTrend || []) as any[]).filter((a: any) => {
        const created = new Date(a.created_at).getTime()
        return created >= dayStart && created <= dayEnd
      }).length

      const dayInterviews = ((allInterviewsTrend || []) as any[]).filter((i: any) => {
        const created = new Date(i.created_at).getTime()
        return created >= dayStart && created <= dayEnd
      }).length

      const dayHires = ((allHiresTrend || []) as any[]).filter((h: any) => {
        const updated = new Date(h.updated_at).getTime()
        return updated >= dayStart && updated <= dayEnd
      }).length

      applicationsTrend.push({ date: dateStr, count: dayApplications })
      interviewsTrend.push({ date: dateStr, count: dayInterviews })
      hiresTrend.push({ date: dateStr, count: dayHires })
    }

    // ========== DISTRIBUTION DATA ==========

    // Applications by status
    const { data: applicationsByStatus } = await fromAts('applications')
      .select('status')
      .is('deleted_at', null)

    const applicationStatusCounts: Record<string, number> = {}
    ;(applicationsByStatus || []).forEach((app: any) => {
      applicationStatusCounts[app.status] = (applicationStatusCounts[app.status] || 0) + 1
    })

    // Interviews by type
    const { data: interviewsByType } = await fromAts('interviews')
      .select('interview_type')
      .is('deleted_at', null)

    const interviewTypeCounts: Record<string, number> = {}
    ;(interviewsByType || []).forEach((interview: any) => {
      interviewTypeCounts[interview.interview_type] = (interviewTypeCounts[interview.interview_type] || 0) + 1
    })

    // Interviews by status
    const { data: interviewsByStatus } = await fromAts('interviews')
      .select('status')
      .is('deleted_at', null)

    const interviewStatusCounts: Record<string, number> = {}
    ;(interviewsByStatus || []).forEach((interview: any) => {
      interviewStatusCounts[interview.status] = (interviewStatusCounts[interview.status] || 0) + 1
    })

    // Source of hire (candidates by source)
    const { data: candidatesBySource } = await fromAts('candidates')
      .select('source, status')
      .is('deleted_at', null)

    const sourceCounts: Record<string, number> = {}
    ;(candidatesBySource || []).forEach((c: any) => {
      const source = c.source || 'other'
      sourceCounts[source] = (sourceCounts[source] || 0) + 1
    })

    // Applications by job role/department
    const { data: applicationsWithJobs } = await fromAts('applications')
      .select('job_listing_id')
      .is('deleted_at', null)
      .not('job_listing_id', 'is', null)

    const jobListingIds = [...new Set((applicationsWithJobs || []).map((a: any) => a.job_listing_id))]
    const { data: jobListingsWithRoles } = await fromAts('job_listings')
      .select('id, job_role_id')
      .in('id', jobListingIds)
      .is('deleted_at', null)

    const { data: jobRoles } = await fromAts('job_roles')
      .select('id, title, department')
      .is('deleted_at', null)

    const jobRolesMap = new Map((jobRoles || []).map((r: any) => [r.id, r]))
    const applicationsByDepartment: Record<string, number> = {}
    const jobListingsMapForDept = new Map((jobListingsWithRoles || []).map((j: any) => [j.id, j]))

    ;(applicationsWithJobs || []).forEach((app: any) => {
      const jobListing = jobListingsMapForDept.get(app.job_listing_id)
      if (jobListing?.job_role_id) {
        const jobRole = jobRolesMap.get(jobListing.job_role_id)
        const dept = jobRole?.department || 'Unknown'
        applicationsByDepartment[dept] = (applicationsByDepartment[dept] || 0) + 1
      }
    })

    // ========== PIPELINE METRICS ==========

    // Application funnel
    const appliedCount = applicationStatusCounts['applied'] || 0
    const screeningCount = applicationStatusCounts['screening'] || 0
    const interviewCount = applicationStatusCounts['interview'] || 0
    const offerCount = candidatesByStatus['offered'] || 0
    const acceptedCount = candidatesByStatus['hired'] || 0

    const funnelData = [
      {
        stage: 'Applied',
        count: appliedCount,
        conversionRate: 100,
      },
      {
        stage: 'Screening',
        count: screeningCount,
        conversionRate: appliedCount > 0 ? Math.round((screeningCount / appliedCount) * 100) : 0,
      },
      {
        stage: 'Interview',
        count: interviewCount,
        conversionRate: screeningCount > 0 ? Math.round((interviewCount / screeningCount) * 100) : 0,
      },
      {
        stage: 'Offer',
        count: offerCount,
        conversionRate: interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0,
      },
      {
        stage: 'Accepted',
        count: acceptedCount,
        conversionRate: offerCount > 0 ? Math.round((acceptedCount / offerCount) * 100) : 0,
      },
    ]

    // Interview completion rate
    const { count: totalInterviews } = await fromAts('interviews')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
    const completedInterviews = interviewStatusCounts['completed'] || 0
    const interviewCompletionRate = totalInterviews && totalInterviews > 0
      ? Math.round((completedInterviews / totalInterviews) * 100)
      : 0

    // Average interview rating
    const { data: evaluations } = await fromAts('evaluations')
      .select('overall_rating, interview_id')
      .is('deleted_at', null)
      .not('overall_rating', 'is', null)

    const ratingsSum = (evaluations || []).reduce((sum: number, e: any) => sum + (e.overall_rating || 0), 0)
    const ratingsCount = evaluations?.length || 0
    const averageInterviewRating = ratingsCount > 0 ? Math.round((ratingsSum / ratingsCount) * 10) / 10 : 0

    // Average rating by interview type
    const { data: interviewsWithEvaluations } = await fromAts('interviews')
      .select('id, interview_type')
      .is('deleted_at', null)

    const interviewsMap = new Map((interviewsWithEvaluations || []).map((i: any) => [i.id, i]))
    const ratingsByType: Record<string, { sum: number; count: number }> = {}

    ;(evaluations || []).forEach((e: any) => {
      const interview = interviewsMap.get(e.interview_id)
      if (interview?.interview_type) {
        const type = interview.interview_type
        if (!ratingsByType[type]) {
          ratingsByType[type] = { sum: 0, count: 0 }
        }
        ratingsByType[type].sum += e.overall_rating || 0
        ratingsByType[type].count++
      }
    })

    const averageRatingByType = Object.entries(ratingsByType).map(([type, data]) => ({
      type,
      average: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : 0,
    }))

    // ========== JOB POSTING METRICS ==========

    // Active job listings with details
    const { data: activeJobListings } = await fromAts('job_listings')
      .select('id, job_role_id, status, applications_count, views_count, posted_at')
      .is('deleted_at', null)
      .eq('status', 'active')
      .order('applications_count', { ascending: false })
      .limit(10)

    // Get job role details
    const activeJobRoleIds = [...new Set((activeJobListings || []).map((j: any) => j.job_role_id).filter(Boolean))]
    const { data: activeJobRoles } = await fromAts('job_roles')
      .select('id, title, department')
      .in('id', activeJobRoleIds)
      .is('deleted_at', null)

    const activeJobRolesMap = new Map((activeJobRoles || []).map((r: any) => [r.id, r]))

    const topJobListings = (activeJobListings || []).map((listing: any) => {
      const role = activeJobRolesMap.get(listing.job_role_id)
      return {
        id: listing.id,
        title: role?.title || 'Unknown',
        department: role?.department || 'Unknown',
        applicationsCount: listing.applications_count || 0,
        viewsCount: listing.views_count || 0,
        status: listing.status,
        postedAt: listing.posted_at,
      }
    })

    // Top performing job portals
    const { data: allJobListingsForPortals } = await fromAts('job_listings')
      .select('job_portal_id, applications_count, views_count')
      .is('deleted_at', null)

    const portalStats: Record<string, { applications: number; views: number }> = {}
    ;(allJobListingsForPortals || []).forEach((listing: any) => {
      if (listing.job_portal_id) {
        if (!portalStats[listing.job_portal_id]) {
          portalStats[listing.job_portal_id] = { applications: 0, views: 0 }
        }
        portalStats[listing.job_portal_id].applications += listing.applications_count || 0
        portalStats[listing.job_portal_id].views += listing.views_count || 0
      }
    })

    const portalIds = Object.keys(portalStats)
    const { data: portals } = await fromAts('job_portals')
      .select('id, name')
      .in('id', portalIds)
      .is('deleted_at', null)

    const portalsMap = new Map((portals || []).map((p: any) => [p.id, p]))
    const topPortals = Object.entries(portalStats)
      .map(([id, stats]) => ({
        id,
        name: portalsMap.get(id)?.name || 'Unknown',
        applications: stats.applications,
        views: stats.views,
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5)

    // ========== RECRUITER PERFORMANCE ==========

    const { data: candidatesWithRecruiters } = await fromAts('candidates')
      .select('id, recruiter_id, status')
      .is('deleted_at', null)
      .not('recruiter_id', 'is', null)

    const recruiterStats: Record<string, { candidates: number; interviews: number; hires: number }> = {}
    ;(candidatesWithRecruiters || []).forEach((c: any) => {
      const recruiterId = c.recruiter_id
      if (!recruiterStats[recruiterId]) {
        recruiterStats[recruiterId] = { candidates: 0, interviews: 0, hires: 0 }
      }
      recruiterStats[recruiterId].candidates++
      if (c.status === 'hired') {
        recruiterStats[recruiterId].hires++
      }
    })

    // Get interviews by recruiter (via candidate)
    const candidateIds = (candidatesWithRecruiters || []).map((c: any) => c.id)
    const { data: interviewsByRecruiter } = await fromAts('interviews')
      .select('candidate_id')
      .in('candidate_id', candidateIds)
      .is('deleted_at', null)

    const candidateToRecruiterMap = new Map((candidatesWithRecruiters || []).map((c: any) => [c.id, c.recruiter_id]))
    ;(interviewsByRecruiter || []).forEach((i: any) => {
      const recruiterId = candidateToRecruiterMap.get(i.candidate_id)
      if (recruiterId && recruiterStats[recruiterId]) {
        recruiterStats[recruiterId].interviews++
      }
    })

    const recruiterIds = Object.keys(recruiterStats)
    const { data: recruiterProfiles } = await fromCore('profiles')
      .select('id, first_name, last_name')
      .in('id', recruiterIds)

    const recruiterProfilesMap = new Map((recruiterProfiles || []).map((p: any) => [p.id, p]))
    const recruiterPerformance = Object.entries(recruiterStats)
      .map(([id, stats]) => ({
        id,
        name: recruiterProfilesMap.get(id)
          ? `${recruiterProfilesMap.get(id)?.first_name || ''} ${recruiterProfilesMap.get(id)?.last_name || ''}`.trim()
          : 'Unknown',
        candidates: stats.candidates,
        interviews: stats.interviews,
        hires: stats.hires,
      }))
      .sort((a, b) => b.hires - a.hires)
      .slice(0, 10)

    // ========== RECENT ACTIVITY ==========

    // Recent applications
    const { data: recentApplications } = await fromAts('applications')
      .select('id, candidate_id, status, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10)

    // Recent interviews
    const { data: recentInterviews } = await fromAts('interviews')
      .select('id, candidate_id, interview_type, scheduled_at, status, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10)

    // Format recent activity
    const recentActivity: Array<{
      id: string
      type: string
      description: string
      timestamp: string
    }> = []

    ;(recentApplications || []).forEach((app: any) => {
      recentActivity.push({
        id: app.id,
        type: 'application',
        description: `New application - Status: ${app.status}`,
        timestamp: app.created_at,
      })
    })

    ;(recentInterviews || []).forEach((interview: any) => {
      recentActivity.push({
        id: interview.id,
        type: 'interview',
        description: `${interview.interview_type} interview ${interview.status === 'scheduled' ? 'scheduled' : interview.status}`,
        timestamp: interview.created_at,
      })
    })

    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const topRecentActivity = recentActivity.slice(0, 15)

    // ========== RETURN COMPREHENSIVE METRICS ==========

    return NextResponse.json({
      // Core KPIs
      totalCandidates: totalCandidates || 0,
      candidatesByStatus,
      activeApplications: activeApplications || 0,
      upcomingInterviews: upcomingInterviews || 0,
      openPositions: openPositions || 0,
      hiredThisMonth: hiredThisMonth || 0,
      offersPending: offersPending || 0,
      averageTimeToFill,
      offerAcceptanceRate,

      // Trend Data
      applicationsTrend,
      interviewsTrend,
      hiresTrend,

      // Distribution Data
      applicationsByStatus: applicationStatusCounts,
      candidatesByStatusDistribution: Object.entries(candidatesByStatus).map(([name, value]) => ({ name, value })),
      interviewsByType: Object.entries(interviewTypeCounts).map(([name, value]) => ({ name, value })),
      interviewsByStatus: Object.entries(interviewStatusCounts).map(([name, value]) => ({ name, value })),
      sourceOfHire: Object.entries(sourceCounts).map(([name, value]) => ({ name, value })),
      applicationsByDepartment: Object.entries(applicationsByDepartment).map(([name, value]) => ({ name, value })),

      // Pipeline Metrics
      funnelData,
      interviewCompletionRate,
      averageInterviewRating,
      averageRatingByType,

      // Job Posting Metrics
      topJobListings,
      topPortals,

      // Recruiter Performance
      recruiterPerformance,

      // Recent Activity
      recentActivity: topRecentActivity,
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}

