"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Clock, Filter, Loader2 } from "lucide-react"
import { playtomicAPI, type TimeSlot } from "@/lib/playtomic-api"

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DURATION_OPTIONS = [
  { value: "60+", label: "60+ minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
] as const
const CLUB_WEBSITES: Record<string, string> = {
  "Bisma Padel": "https://www.bismapadel.com",
  "Padel of Gods": "https://www.padelofgods.com",
  "Simply Padel Sanur": "https://www.simplypadel.com",
}

const getDateString = (offset: number = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().split("T")[0]
}

const getNext14Days = () => Array.from({ length: 14 }, (_, i) => getDateString(i))

export default function PadelAvailability() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(getDateString())
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedClub, setSelectedClub] = useState<string>("all")
  const [selectedDuration, setSelectedDuration] = useState<string>("60+")
  const [cache, setCache] = useState<Record<string, TimeSlot[]>>({})

  useEffect(() => {
    const loadAvailability = async () => {
      if (cache[selectedDate]) {
        setTimeSlots(cache[selectedDate])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const slots = await playtomicAPI.getAllSlotsForBothLocations(selectedDate)
        setTimeSlots(slots)
        setCache((prev) => ({ ...prev, [selectedDate]: slots }))
      } catch {
        setError("Failed to load availability. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadAvailability()
  }, [selectedDate, cache])

  const filteredSlots = useMemo(() => {
    const oneHourFromNow = new Date(Date.now() + 3600000)
    const durationFilters: Record<string, (d: number) => boolean> = {
      "60+": (d) => d >= 60,
      "60": (d) => d === 60,
      "90": (d) => d === 90,
    }

    return timeSlots.filter((slot) => {
      const slotTime = new Date(`${slot.date}T${slot.time}`)
      return (
        slotTime > oneHourFromNow &&
        (selectedDuration === "60+" || durationFilters[selectedDuration]?.(slot.duration)) &&
        (selectedLocation === "all" || slot.location === selectedLocation) &&
        (selectedClub === "all" || slot.club === selectedClub)
      )
    })
  }, [timeSlots, selectedDuration, selectedLocation, selectedClub])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = getDateString(0)
    const tomorrow = getDateString(1)

    if (dateString === today) return "Today"
    if (dateString === tomorrow) return "Tomorrow"

    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price)

  const formatCourtName = (courtName: string) => {
    if (/^[0-9a-f]{8}-/.test(courtName)) {
      return `Court ${courtName.slice(-8, -4).toUpperCase()}`
    }
    return courtName.startsWith("Court") ? courtName : `Court ${courtName}`
  }

  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const handleBookNow = (slot: TimeSlot) => {
    const url = isMobile()
      ? `playtomic://book/${slot.club}/${slot.date}/${slot.time}`
      : CLUB_WEBSITES[slot.club] || "https://playtomic.io"

    if (isMobile() && url.startsWith("playtomic://")) {
      window.location.href = url
      setTimeout(() => window.open("https://playtomic.io", "_blank"), 1000)
    } else {
      window.open(url, "_blank")
    }
  }

  const uniqueDates = getNext14Days()
  const uniqueClubs = [...new Set(timeSlots.map((s) => s.club))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sage-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-sage-600">Loading padel availability...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sage-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sage-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-jungle-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-jungle-900">Padel Courts</h1>
              <p className="text-sage-600 text-sm">Ubud & Sanur Availability</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-[140px] bg-white border-emerald-200">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                {uniqueDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {formatDate(date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[120px] bg-white border-emerald-200">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Ubud">Ubud</SelectItem>
                <SelectItem value="Sanur">Sanur</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger className="w-[160px] bg-white border-emerald-200">
                <SelectValue placeholder="Club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {uniqueClubs.map((club) => (
                  <SelectItem key={club} value={club}>
                    {club}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger className="w-[140px] bg-white border-emerald-200">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weekday Quick Selection Buttons */}
          <div className="mt-4">
            <p className="text-sm text-sage-600 mb-2">Quick select by weekday:</p>
            <div className="flex flex-wrap gap-2">
              {getNext14Days().map((date) => {
                const dateObj = new Date(date)
                const today = getDateString(0)
                const tomorrow = getDateString(1)
                const dayLabel = WEEKDAYS[dateObj.getDay()].slice(0, 3)
                const label =
                  date === today ? `${dayLabel} (Today)` : date === tomorrow ? `${dayLabel} (Tomorrow)` : dayLabel

                return (
                  <Button
                    key={date}
                    variant={selectedDate === date ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(date)}
                    className={`text-xs ${
                      selectedDate === date
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-white hover:bg-emerald-50 text-sage-700 border-emerald-200"
                    }`}
                  >
                    {label}
                    <span className="ml-1 opacity-75">{dateObj.getDate()}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sage-700">
            {filteredSlots.length} available slot{filteredSlots.length !== 1 ? "s" : ""}
          </p>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <Filter className="w-3 h-3 mr-1" />
            Live Data
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSlots.map((slot) => (
            <Card
              key={slot.id}
              className="bg-white/90 backdrop-blur-sm border-emerald-100 hover:shadow-lg transition-all duration-200 hover:border-emerald-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-jungle-900 mb-1">{slot.club}</CardTitle>
                    <div className="flex items-center gap-1 text-sage-600 text-sm">
                      <MapPin className="w-3 h-3" />
                      {slot.location}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${slot.location === "Ubud" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {slot.location}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sage-700">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{formatDate(slot.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sage-700">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {slot.time} ({slot.duration}min)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-sage-600">{formatCourtName(slot.court)}</span>
                    <span className="font-semibold text-jungle-900">{formatPrice(slot.price)}</span>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-emerald-600 to-jungle-600 hover:from-emerald-700 hover:to-jungle-700 text-white"
                    size="sm"
                    onClick={() => handleBookNow(slot)} // Added click handler for smart booking
                  >
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSlots.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-sage-400" />
            </div>
            <h3 className="text-lg font-semibold text-sage-900 mb-2">No slots available</h3>
            <p className="text-sage-600">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  )
}
