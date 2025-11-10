'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EventFull, EventFormData } from '@/lib/types/events'
import { toast } from 'sonner'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function CalendarPageContent() {
  const { user: clerkUser } = useUser()
  const [events, setEvents] = useState<EventFull[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventFull | null>(null)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_type: 'meeting',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    all_day: false,
    location: '',
    organizer_id: clerkUser?.id || '',
    status: 'scheduled',
  })

  const fetchEvents = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      const { data, error } = await supabase
        .from('events')
        .select('*, organizer:profiles(id, first_name, last_name), participants:event_participants(profile:profiles(id, first_name, last_name), status)')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString())
        .is('deleted_at', null)
        .order('start_time', { ascending: true })

      if (error) throw error

      setEvents(data || [])
    } catch (error: any) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [clerkUser?.id, currentDate])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkUser?.id || !formData.title.trim()) return

    try {
      const supabase = createClient()

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEvent.id)

        if (error) throw error
        toast.success('Event updated successfully')
      } else {
        const { error } = await supabase.from('events').insert({
          ...formData,
          created_by: clerkUser.id,
        })

        if (error) throw error
        toast.success('Event created successfully')
      }

      setFormOpen(false)
      setEditingEvent(null)
      await fetchEvents()
    } catch (error: any) {
      console.error('Error saving event:', error)
      toast.error(error.message || 'Failed to save event')
    }
  }

  const handleDelete = async (event: EventFull) => {
    if (!clerkUser?.id) return
    if (!confirm(`Are you sure you want to delete ${event.title}?`)) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', event.id)

      if (error) throw error
      toast.success('Event deleted successfully')
      await fetchEvents()
    } catch (error: any) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    }
  }

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || '',
        event_type: editingEvent.event_type || 'meeting',
        start_time: editingEvent.start_time,
        end_time: editingEvent.end_time,
        all_day: editingEvent.all_day || false,
        location: editingEvent.location || '',
        organizer_id: editingEvent.organizer_id,
        lead_id: editingEvent.lead_id || undefined,
        status: editingEvent.status || 'scheduled',
        reminder_minutes: editingEvent.reminder_minutes || undefined,
      })
    } else if (selectedDate) {
      const start = new Date(selectedDate)
      start.setHours(9, 0, 0, 0)
      const end = new Date(selectedDate)
      end.setHours(10, 0, 0, 0)
      setFormData({
        title: '',
        description: '',
        event_type: 'meeting',
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        all_day: false,
        location: '',
        organizer_id: clerkUser?.id || '',
        status: 'scheduled',
      })
    } else {
      setFormData({
        title: '',
        description: '',
        event_type: 'meeting',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        all_day: false,
        location: '',
        organizer_id: clerkUser?.id || '',
        status: 'scheduled',
      })
    }
  }, [editingEvent, selectedDate, clerkUser?.id, formOpen])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time)
      return isSameDay(eventDate, date)
    })
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Calendar</h1>
            <p className="text-xs text-muted-foreground mt-0.5">View and manage your events</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              Previous
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              Next
            </Button>
            <Button onClick={() => {
              setSelectedDate(null)
              setEditingEvent(null)
              setFormOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">Loading calendar...</div>
            </div>
          ) : (
            <div className="border rounded-lg">
              <div className="grid grid-cols-7 border-b">
                {weekDays.map((day) => (
                  <div key={day} className="p-2 text-center font-medium text-sm border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day) => {
                  const dayEvents = getEventsForDate(day)
                  const isToday = isSameDay(day, new Date())
                  const isCurrentMonth = isSameMonth(day, currentDate)

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[100px] border-r border-b last:border-r-0 p-2 ${
                        !isCurrentMonth ? 'bg-muted/50' : ''
                      } ${isToday ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`text-sm mb-1 ${isToday ? 'font-bold text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => {
                              setEditingEvent(event)
                              setFormOpen(true)
                            }}
                            className="w-full text-left text-xs p-1 rounded bg-blue-100 hover:bg-blue-200 truncate"
                          >
                            {format(new Date(event.start_time), 'HH:mm')} {event.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground p-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Update event information.' : 'Create a new calendar event.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="event_type">Type</Label>
                  <Select
                    value={formData.event_type || 'meeting'}
                    onValueChange={(value) => setFormData({ ...formData, event_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || 'scheduled'}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time ? format(new Date(formData.start_time), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => setFormData({ ...formData, start_time: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time ? format(new Date(formData.end_time), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => setFormData({ ...formData, end_time: new Date(e.target.value).toISOString() })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Meeting location"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              {editingEvent && (
                <Button type="button" variant="destructive" onClick={() => {
                  handleDelete(editingEvent)
                  setFormOpen(false)
                }}>
                  Delete
                </Button>
              )}
              <Button type="submit" disabled={!formData.title.trim()}>
                {editingEvent ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CalendarPageContent />
    </Suspense>
  )
}
