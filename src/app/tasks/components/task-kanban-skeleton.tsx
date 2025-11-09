"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function TaskKanbanSkeleton() {
  const columns = ["Pending", "In Progress", "Completed", "Cancelled"]
  
  return (
    <div className="w-full overflow-x-auto overflow-y-hidden">
      <div className="inline-flex gap-4 md:gap-6 pb-4 p-2 md:p-4 min-h-[500px]">
        {columns.map((column) => (
          <div key={column} className="flex-shrink-0 w-[280px] md:w-80">
            <div className="rounded-lg border-2 bg-muted/30 p-3 md:p-4 h-full flex flex-col min-h-[500px] max-h-[calc(100vh-220px)]">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-8" />
              </div>
              
              <div className="space-y-3 overflow-y-auto flex-1 pr-2 min-h-0">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Card key={idx} className="bg-card shadow-sm">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Skeleton className="w-full h-9 mt-3 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

