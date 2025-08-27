"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Clock, Filter, Loader2 } from "lucide-react"
import { playtomicAPI, type TimeSlot } from "@/lib/playtomic-api"

export default function PadelAvailability() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [filteredSlots, setFilteredSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("today")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedClub, setSelectedClub] = useState<string>("all")
  const [selectedDuration, setSelectedDuration] = useState<string>("60+")
  const [cache, setCache] = useState<Record<string, TimeSlot[]>>({})
  const [renderKey, setRenderKey] = useState(0)

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0]
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  }

  const getNext14Days = () => {
    const dates = []
    for (let i = 0; i < 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      dates.push(date.toISOString().split("T")[0])
    }
    return dates
  }

  const getWeekdayName = (weekdayIndex: number) => {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return weekdays[weekdayIndex]
  }

  const loadAvailability = useCallback(
    async (dateToFetch: string) => {
      if (cache[dateToFetch]) {
        console.log("[v0] Using cached data for date:", dateToFetch)
        setTimeSlots(cache[dateToFetch])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        console.log("[v0] Fetching availability for date:", dateToFetch)
        const slots = await playtomicAPI.getAllSlotsForBothLocations(dateToFetch)
        console.log("[v0] Received slots:", slots.length)

        setTimeSlots(slots)
        setCache((prev) => ({ ...prev, [dateToFetch]: slots }))
      } catch (err) {
        console.error("[v0] Error loading availability:", err)
        setError("Failed to load availability. Please try again.")
      } finally {
        setLoading(false)
      }
    },
    [cache],
  )

  useEffect(() => {
    const dateToFetch =
      selectedDate === "today" ? getTodayDate() : selectedDate === "tomorrow" ? getTomorrowDate() : selectedDate

    loadAvailability(dateToFetch)
  }, [selectedDate, loadAvailability])

  const uniqueDates = getNext14Days()
  const uniqueClubs = [...new Set(timeSlots.map((slot) => slot.club))]

  useEffect(() => {
    let filtered = [...timeSlots] // Create new array reference to ensure React detects changes

    console.log("[v0] Starting filtering with", timeSlots.length, "total slots")
    console.log("[v0] Selected duration filter:", selectedDuration)

    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    // Filter out past slots (before 1 hour from now)
    filtered = filtered.filter((slot) => {
      const slotDateTime = new Date(`${slot.date}T${slot.time}`)
      return slotDateTime > oneHourFromNow
    })

    console.log("[v0] After time filtering:", filtered.length, "slots")

    if (selectedDuration === "60+") {
      filtered = filtered.filter((slot) => slot.duration >= 60)
      console.log("[v0] After 60+ duration filtering:", filtered.length, "slots")
    } else if (selectedDuration === "60") {
      filtered = filtered.filter((slot) => slot.duration === 60)
      console.log("[v0] After 60min duration filtering:", filtered.length, "slots")
    } else if (selectedDuration === "90") {
      filtered = filtered.filter((slot) => slot.duration === 90)
      console.log("[v0] After 90min duration filtering:", filtered.length, "slots")
      const durations = filtered.map((slot) => slot.duration)
      console.log("[v0] Remaining slot durations after 90min filter:", durations)
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter((slot) => slot.location === selectedLocation)
      console.log("[v0] After location filtering:", filtered.length, "slots")
    }

    if (selectedClub !== "all") {
      filtered = filtered.filter((slot) => slot.club === selectedClub)
      console.log("[v0] After club filtering:", filtered.length, "slots")
    }

    console.log("[v0] Final filtered slots:", filtered.length)
    console.log("[v0] Setting filteredSlots to new array with length:", filtered.length) // Added debug log
    setFilteredSlots([...filtered]) // Ensure new array reference for React re-render
    setRenderKey((prev) => prev + 1)
  }, [selectedLocation, selectedClub, timeSlots, selectedDuration])

  const formatDate = (dateString: string) => {
    if (dateString === "today") return "Today"
    if (dateString === "tomorrow") return "Tomorrow"

    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    if (dateString === today.toISOString().split("T")[0]) return "Today"
    if (dateString === tomorrow.toISOString().split("T")[0]) return "Tomorrow"

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatCourtName = (courtName: string) => {
    if (courtName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const shortId = courtName.slice(-8).toUpperCase()
      return `Court ${shortId.slice(0, 4)}`
    }

    if (courtName.startsWith("Court ") && courtName.length > 15) {
      const parts = courtName.split(" ")
      if (parts[1] && parts[1].length > 8) {
        return `Court ${parts[1].slice(0, 4).toUpperCase()}`
      }
    }

    return courtName
  }

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const getBookingUrl = (slot: TimeSlot) => {
    if (isMobile()) {
      // On mobile, try to open Playtomic app
      return `playtomic://book/${slot.tenantId}/${slot.resourceId}/${slot.date}/${slot.time}`
    } else {
      // On desktop, try club website first, then fallback to Playtomic web
      const clubWebsites: Record<string, string> = {
        "Bisma Padel": "https://www.bismapadel.com",
        "Padel of Gods": "https://www.padelofgods.com",
        "Simply Padel Sanur": "https://www.simplypadel.com",
        // Add more club websites as they become available
      }

      return clubWebsites[slot.club] || `https://playtomic.io/club/${slot.tenantId}`
    }
  }

  const handleBookNow = (slot: TimeSlot) => {
    const url = getBookingUrl(slot)

    if (isMobile() && url.startsWith("playtomic://")) {
      // Try to open app, fallback to web if app not installed
      window.location.href = url

      // Fallback to web version after a short delay if app doesn't open
      setTimeout(() => {
        window.open(`https://playtomic.io/club/${slot.tenantId}`, "_blank")
      }, 1000)
    } else {
      // Open in new tab for desktop
      window.open(url, "_blank")
    }
  }

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
                <SelectItem value="60+">60+ minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weekday Quick Selection Buttons */}
          <div className="mt-4">
            <p className="text-sm text-sage-600 mb-2">Quick select by weekday:</p>
            <div className="flex flex-wrap gap-2">
              {getNext14Days().map((date) => {
                const dateObj = new Date(date)
                const weekdayName = getWeekdayName(dateObj.getDay())
                const isToday = date === getTodayDate()
                const isTomorrow = date === getTomorrowDate()

                let label = weekdayName.slice(0, 3)
                if (isToday) label += " (Today)"
                else if (isTomorrow) label += " (Tomorrow)"

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
                    <span className="ml-1 text-xs opacity-75">{dateObj.getDate()}</span>
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
          {filteredSlots.map((slot, index) => (
            <Card
              key={`${slot.id}-${renderKey}-${index}`}
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
