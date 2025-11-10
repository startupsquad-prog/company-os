'use client'

import { GreetingSection } from '@/components/home/greeting-section'
import { KPICardsSection } from '@/components/home/kpi-cards-section'
import { QuickStatsSection } from '@/components/home/quick-stats-section'
import { FavoriteModulesSection } from '@/components/home/favorite-modules-section'
import { QuickLinksSection } from '@/components/home/quick-links-section'
import { AIAgentsSection } from '@/components/home/ai-agents-section'
import { UpcomingDeadlinesSection } from '@/components/home/upcoming-deadlines-section'
import { RecentActivitySection } from '@/components/home/recent-activity-section'
import { NotificationsSummarySection } from '@/components/home/notifications-summary-section'
import { PerformanceChartSection } from '@/components/home/performance-chart-section'
import { recentActivities } from '@/lib/home/recent-activity-data'
import { upcomingDeadlines } from '@/lib/home/upcoming-deadlines-data'
import { Separator } from '@/components/ui/separator'

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-7xl mx-auto w-full">
          {/* Greeting Section */}
          <GreetingSection />

          {/* KPI Cards Section */}
          <KPICardsSection />

          {/* Quick Stats Section */}
          <QuickStatsSection />

          {/* Performance Chart Section */}
          <PerformanceChartSection />

          <Separator className="my-6" />

          {/* Favorite Modules Section */}
          <FavoriteModulesSection />

          {/* Quick Links Section */}
          <QuickLinksSection />

          {/* AI Agents Section */}
          <AIAgentsSection />

          <Separator className="my-6" />

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Upcoming Deadlines Section */}
            <div className="lg:col-span-1">
              <UpcomingDeadlinesSection deadlines={upcomingDeadlines} />
            </div>

            {/* Recent Activity Section */}
            <div className="lg:col-span-1">
              <RecentActivitySection activities={recentActivities} />
            </div>

            {/* Notifications Summary Section */}
            <div className="lg:col-span-1">
              <NotificationsSummarySection />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

