'use client'

import { useState, useEffect } from 'react'

export interface SalesData {
  current: number
  target: number
  dailyData: Array<{
    date: string
    amount: number
  }>
  progress: number
  remaining: number
}

const TARGET = 100000 // ₹1,00,000/month

// Generate mock daily sales data for last 30 days
function generateMockDailyData(): Array<{ date: string; amount: number }> {
  const data: Array<{ date: string; amount: number }> = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Random sales between ₹2000 and ₹5000 per day
    const amount = Math.floor(Math.random() * 3000) + 2000
    data.push({
      date: date.toISOString().split('T')[0],
      amount,
    })
  }

  return data
}

export function useSalesData() {
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const dailyData = generateMockDailyData()
      const current = dailyData.reduce((sum, day) => sum + day.amount, 0)
      const progress = Math.min((current / TARGET) * 100, 100)
      const remaining = Math.max(TARGET - current, 0)

      setData({
        current,
        target: TARGET,
        dailyData,
        progress,
        remaining,
      })

      setLoading(false)
    }

    fetchData()
  }, [])

  return { data, loading }
}
