"use client"

import { useState, useEffect } from "react"
import { Plane, Hotel, CreditCard, MapPin, Eye, Loader2, ArrowRight, Star, Clock } from "lucide-react"

export default function NiyoTravelPlanner() {
  const [currentScreen, setCurrentScreen] = useState<"home" | "flights" | "hotels" | "attractions" | "forex">("home")
  const [selectedAttractions, setSelectedAttractions] = useState<any[]>([])
  const [selectedFlight, setSelectedFlight] = useState<any>(null)
  const [selectedHotel, setSelectedHotel] = useState<any>(null)
  const [tripData, setTripData] = useState({
    destination: "london",
    startDate: "2024-03-15",
    endDate: "2024-03-22",
    duration: 7,
    travelers: 2,
    flightBudget: "Economy",
    hotelBudget: "3-Star",
    flightBudget: "mid" as "budget" | "mid" | "premium",
    hotelBudget: "mid" as "budget" | "mid" | "premium",
    hotelRating: 4,
  })

  // Niyo Coins system (10 coins = ₹1)
  const [niyoCoins, setNiyoCoins] = useState(15000) // User's current coins

  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState<any>({})
  const [cashRecommendation, setCashRecommendation] = useState<any>({})
  const [aiCashBreakdown, setAiCashBreakdown] = useState<Record<string, any>>({})

  const [loading, setLoading] = useState({
    forex: false,
    flights: false,
    hotels: false,
    attractions: false,
    cashRecommendations: false,
  })

  const [realTimeData, setRealTimeData] = useState<any>({
    forexRates: {},
    flightPrices: {},
    hotelPrices: {},
    attractionPrices: {},
  })

  const [lastForexUpdate, setLastForexUpdate] = useState<Date | null>(null)

  const [apiResponses, setApiResponses] = useState<any>({})

  // IMPORTANT: keep static meta in a const, but do NOT mutate it for attractions
  const destinations = {
    london: {
      name: "London",
      currency: "GBP",
      flag: "🇬🇧",
      countryCode: "GB",
      cityCode: "LON",
      coordinates: { lat: 51.5074, lon: -0.1278 },
      dailyCash: { food: 45, transport: 15, misc: 20 },
    },
    singapore: {
      name: "Singapore",
      currency: "SGD",
      flag: "🇸🇬",
      countryCode: "SG",
      cityCode: "SIN",
      coordinates: { lat: 1.3521, lon: 103.8198 },
      dailyCash: { food: 35, transport: 12, misc: 18 },
    },
    dubai: {
      name: "Dubai",
      currency: "AED",
      flag: "🇦🇪",
      countryCode: "AE",
      cityCode: "DXB",
      coordinates: { lat: 25.2048, lon: 55.2708 },
      dailyCash: { food: 120, transport: 25, misc: 35 },
    },
  } as const

  // STATE for processed attractions per destination (do not store inside destinations object)
  const [destAttractions, setDestAttractions] = useState<Record<string, any[]>>({
    london: [],
    singapore: [],
    dubai: [],
  })

  const [hotelDetails, setHotelDetails] = useState<Record<string, any[]>>({})
  const [amadeusToken, setAmadeusToken] = useState<string | null>(null)

  // Date range selection
  const [selectedDates, setSelectedDates] = useState({
    departure: new Date(),
    return: new Date(new Date().setDate(new Date().getDate() + tripData.duration)),
  })

  const [flightDetails, setFlightDetails] = useState<{
    [key: string]: any[]
  }>({})

  const [competitorRates, setCompetitorRates] = useState<{
    [key: string]: { rate: number; markup: number; fee: number }
  }>({})

  const mockAttractions = {
    london: [
      {
        id: 1,
        name: "Tower of London",
        rating: 4.5,
        price: 2800,
        duration: "3-4 hours",
        category: "Historical",
        image: "/london-tower.png",
        description: "Historic castle and former royal residence",
      },
      {
        id: 2,
        name: "London Eye",
        rating: 4.3,
        price: 3200,
        duration: "30 minutes",
        category: "Sightseeing",
        image: "/london-eye-ferris-wheel.png",
        description: "Giant observation wheel on the Thames",
      },
      {
        id: 3,
        name: "Westminster Abbey",
        rating: 4.6,
        price: 2400,
        duration: "2-3 hours",
        category: "Religious",
        image: "/westminster-abbey-gothic-church.png",
        description: "Gothic abbey church and coronation site",
      },
      {
        id: 4,
        name: "British Museum",
        rating: 4.7,
        price: 0,
        duration: "3-5 hours",
        category: "Museum",
        image: "/british-museum-ancient-artifacts.png",
        description: "World-famous museum with ancient artifacts",
      },
    ],
    singapore: [
      {
        id: 1,
        name: "Gardens by the Bay",
        rating: 4.6,
        price: 2000,
        duration: "2-3 hours",
        category: "Nature",
        image: "/gardens-by-the-bay-singapore-supertrees.png",
        description: "Futuristic gardens with iconic Supertrees",
      },
      {
        id: 2,
        name: "Marina Bay Sands SkyPark",
        rating: 4.4,
        price: 1800,
        duration: "1-2 hours",
        category: "Sightseeing",
        image: "/marina-bay-sands-infinity-pool-singapore.png",
        description: "Observation deck with stunning city views",
      },
      {
        id: 3,
        name: "Universal Studios Singapore",
        rating: 4.3,
        price: 5500,
        duration: "Full day",
        category: "Theme Park",
        image: "/universal-studios-singapore-theme-park.png",
        description: "Hollywood movie-themed amusement park",
      },
    ],
    dubai: [
      {
        id: 1,
        name: "Burj Khalifa",
        rating: 4.5,
        price: 4200,
        duration: "2-3 hours",
        category: "Sightseeing",
        image: "/burj-khalifa-dubai-skyscraper.png",
        description: "World's tallest building with observation decks",
      },
      {
        id: 2,
        name: "Dubai Mall Aquarium",
        rating: 4.2,
        price: 2800,
        duration: "1-2 hours",
        category: "Entertainment",
        image: "/dubai-mall-aquarium-underwater-tunnel.png",
        description: "Massive aquarium with underwater tunnel",
      },
      {
        id: 3,
        name: "Desert Safari",
        rating: 4.7,
        price: 3500,
        duration: "6-8 hours",
        category: "Adventure",
        image: "/dubai-desert-safari-dune-bashing.png",
        description: "Thrilling desert adventure with dune bashing",
      },
    ],
  }

  const getForexRecommendations = () => {
    const currentDest = destinations[tripData.destination as keyof typeof destinations]
    const dailyCash = currentDest.dailyCash
    const totalDailyCash =
      (dailyCash.food + dailyCash.transport + dailyCash.misc) * tripData.duration * tripData.travelers

    return {
      recommended: Math.round(totalDailyCash * 1.2), // 20% buffer
      minimum: totalDailyCash,
      breakdown: {
        food: dailyCash.food * tripData.duration * tripData.travelers,
        transport: dailyCash.transport * tripData.duration * tripData.travelers,
        misc: dailyCash.misc * tripData.duration * tripData.travelers,
        buffer: Math.round(totalDailyCash * 0.2),
      },
      currency: currentDest.currency,
    }
  }

  const mockFlights = {
    london: [
      {
        id: 1,
        airline: "IndiGo",
        airlineCode: "6E-1234",
        price: 45000,
        departure: { time: "02:30", airport: "DEL" },
        arrival: { time: "08:15", airport: "LHR" },
        duration: "8h 45m",
        stops: 0,
      },
      {
        id: 2,
        airline: "Air India",
        airlineCode: "AI-131",
        price: 42000,
        departure: { time: "14:20", airport: "BOM" },
        arrival: { time: "19:45", airport: "LHR" },
        duration: "9h 25m",
        stops: 0,
      },
    ],
    singapore: [
      {
        id: 1,
        airline: "Singapore Airlines",
        airlineCode: "SQ-401",
        price: 38000,
        departure: { time: "11:30", airport: "DEL" },
        arrival: { time: "22:15", airport: "SIN" },
        duration: "5h 45m",
        stops: 0,
      },
    ],
    dubai: [
      {
        id: 1,
        airline: "Emirates",
        airlineCode: "EK-512",
        price: 35000,
        departure: { time: "03:45", airport: "BOM" },
        arrival: { time: "06:30", airport: "DXB" },
        duration: "3h 45m",
        stops: 0,
      },
    ],
  }

  const mockHotels = {
    london: [
      {
        name: "The Shard Hotel",
        rating: 4.5,
        pricePerNight: 12000,
        amenities: ["Wifi", "Gym", "Restaurant", "Spa"],
      },
      {
        name: "Premier Inn London",
        rating: 4.2,
        pricePerNight: 8500,
        amenities: ["Wifi", "Restaurant", "24h Reception"],
      },
    ],
    singapore: [
      {
        name: "Marina Bay Sands",
        rating: 4.6,
        pricePerNight: 18000,
        amenities: ["Infinity Pool", "Casino", "Spa", "Shopping"],
      },
    ],
    dubai: [
      {
        name: "Burj Al Arab",
        rating: 4.8,
        pricePerNight: 25000,
        amenities: ["Private Beach", "Butler Service", "Spa", "Fine Dining"],
      },
    ],
  }

  const currentDest = destinations[tripData.destination as keyof typeof destinations]

  const getCurrentRate = (currency: string) => {
    const baseRates = { USD: 83.2, EUR: 89.5, GBP: 105.8, SGD: 61.4, AED: 22.7 }
    return baseRates[currency as keyof typeof baseRates] || 83.2
  }

  const [flightFilters, setFlightFilters] = useState({
    priceRange: "all",
    airline: "all",
    stops: "all",
    departure: "all",
  })

  const [hotelFilters, setHotelFilters] = useState({
    priceRange: "all",
    rating: "all",
    amenities: "all",
    location: "all",
  })

  useEffect(() => {
    setFlightDetails(mockFlights)
    setHotelDetails(mockHotels)
    setDestAttractions(mockAttractions)

    const flightCost = selectedFlight
      ? selectedFlight.price * tripData.travelers
      : mockFlights[tripData.destination as keyof typeof mockFlights]?.[0]?.price * tripData.travelers || 0

    const hotelCost = selectedHotel
      ? selectedHotel.pricePerNight * tripData.duration
      : mockHotels[tripData.destination as keyof typeof mockHotels]?.[0]?.pricePerNight * tripData.duration || 0

    const attractionsCost = selectedAttractions.reduce((sum, attr) => sum + attr.price, 0) * tripData.travelers
    const forexRec = getForexRecommendations()
    const cashCost = forexRec.recommended * getCurrentRate(forexRec.currency)

    const totalCost = flightCost + hotelCost + attractionsCost + cashCost
    const coinDiscount = Math.min(totalCost * 0.1, niyoCoins / 10) // Max 10% discount
    const finalCost = totalCost - coinDiscount

    setResults({
      flightCost,
      hotelCost,
      attractionsCost,
      cashCost,
      totalCost,
      coinDiscount,
      finalCost,
      cardSavings: 5000, // Mock savings vs traditional banks
    })

    // Set competitor rates
    setCompetitorRates({
      Niyo: { rate: getCurrentRate(currentDest.currency), markup: 0.005, fee: 0 },
      HDFC: { rate: getCurrentRate(currentDest.currency), markup: 0.035, fee: 2500 },
      ICICI: { rate: getCurrentRate(currentDest.currency), markup: 0.032, fee: 2200 },
      TraditionalBank: { rate: getCurrentRate(currentDest.currency), markup: 0.045, fee: 3000 },
    })
  }, [tripData, selectedAttractions, selectedFlight, selectedHotel, niyoCoins])

  const navigateToFlights = () => setCurrentScreen("flights")
  const navigateToHotels = () => setCurrentScreen("hotels")
  const navigateToAttractions = () => setCurrentScreen("attractions")
  const navigateToForex = () => setCurrentScreen("forex")
  const navigateToHome = () => setCurrentScreen("home")

  if (currentScreen === "flights") {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-4 flex items-center gap-3">
          <button onClick={navigateToHome} className="text-purple-400">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-lg font-bold">Flight Search</h1>
        </div>

        <div className="px-4 py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Filters</h3>
            <button
              onClick={() =>
                setFlightFilters({
                  priceRange: "all",
                  airline: "all",
                  stops: "all",
                  departure: "all",
                })
              }
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Price Range</label>
              <select
                value={flightFilters.priceRange}
                onChange={(e) => setFlightFilters({ ...flightFilters, priceRange: e.target.value })}
                className="w-full bg-gray-700 text-white text-xs rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="all">All Prices</option>
                <option value="budget">Under ₹15,000</option>
                <option value="mid">₹15,000 - ₹30,000</option>
                <option value="premium">Above ₹30,000</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Airline</label>
              <select
                value={flightFilters.airline}
                onChange={(e) => setFlightFilters({ ...flightFilters, airline: e.target.value })}
                className="w-full bg-gray-700 text-white text-xs rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="all">All Airlines</option>
                <option value="indigo">IndiGo</option>
                <option value="spicejet">SpiceJet</option>
                <option value="airindia">Air India</option>
                <option value="vistara">Vistara</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Stops</label>
              <select
                value={flightFilters.stops}
                onChange={(e) => setFlightFilters({ ...flightFilters, stops: e.target.value })}
                className="w-full bg-gray-700 text-white text-xs rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="all">All Flights</option>
                <option value="nonstop">Non-Stop</option>
                <option value="onestop">1 Stop</option>
                <option value="twostop">2+ Stops</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Departure</label>
              <select
                value={flightFilters.departure}
                onChange={(e) => setFlightFilters({ ...flightFilters, departure: e.target.value })}
                className="w-full bg-gray-700 text-white text-xs rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="all">Any Time</option>
                <option value="morning">Morning (6AM-12PM)</option>
                <option value="afternoon">Afternoon (12PM-6PM)</option>
                <option value="evening">Evening (6PM-12AM)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="px-4 py-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Flights to {currentDest.name}</h2>
            <p className="text-gray-400 text-sm">
              {tripData.travelers} travelers • {tripData.flightBudget} class
            </p>
          </div>

          <div className="space-y-4">
            {mockFlights[tripData.destination as keyof typeof mockFlights]?.map((flight) => (
              <div key={flight.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Plane className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{flight.airline}</div>
                      <div className="text-xs text-gray-400">{flight.airlineCode}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">₹{flight.price.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">per adult</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="text-center">
                    <div className="font-medium text-white text-lg">{flight.departure.time}</div>
                    <div className="text-xs text-gray-400">{flight.departure.airport}</div>
                  </div>
                  <div className="flex flex-col items-center text-gray-400">
                    <div className="text-xs">{flight.duration}</div>
                    <div className="w-16 h-px bg-gray-500 my-2"></div>
                    <div className="text-xs">{flight.stops === 0 ? "Non-Stop" : `${flight.stops}-Stop`}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-white text-lg">{flight.arrival.time}</div>
                    <div className="text-xs text-gray-400">{flight.arrival.airport}</div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFlight(flight)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    selectedFlight?.id === flight.id
                      ? "bg-green-600 text-white"
                      : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  }`}
                >
                  {selectedFlight?.id === flight.id ? "Selected" : "Select Flight"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedFlight && (
          <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4">
            <div className="flex justify-between items-center text-white">
              <div>
                <div className="font-semibold">{selectedFlight.airline} selected</div>
                <div className="text-sm opacity-90">
                  Total: ₹{(selectedFlight.price * tripData.travelers).toLocaleString()}
                </div>
              </div>
              <button onClick={navigateToHome} className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold">
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (currentScreen === "hotels") {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-4 flex items-center gap-3">
          <button onClick={navigateToHome} className="text-purple-400">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-lg font-bold">Hotel Search</h1>
        </div>

        <div className="px-4 py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Filters</h3>
            <button
              onClick={() =>
                setHotelFilters({
                  priceRange: "all",
                  rating: "all",
                  amenities: "all",
                  location: "all",
                })
              }
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Price Range</label>
              <select
                value={hotelFilters.priceRange}
                onChange={(e) => setHotelFilters({ ...hotelFilters, priceRange: e.target.value })}
                className="w-full bg-gray-700 text-white text-xs rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="all">All Prices</option>
                <option value="budget">Under ₹3,000</option>
                <option value="mid">₹3,000 - ₹8,000</option>
                <option value="luxury">Above ₹8,000</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Star Rating</label>
              <select
                value={hotelFilters.rating}
                onChange={(e) => setHotelFilters({ ...hotelFilters, rating: e.target.value })}
                className="w-full bg-gray-700 text-white text-xs rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="all">All Ratings</option>
                <option value="5star">5 Star</option>
                <option value="4star">4 Star & Above</option>
                <option value="3star">3 Star & Above</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amenities</label>
              <select
                value={hotelFilters.amenities}
                onChange={(e) => setHotelFilters({ ...hotelFilters, amenities: e.target.value })}
                className="w-full bg-gray-700 text-white text-xs rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="all">All Hotels</option>
                <option value="wifi">Free WiFi</option>
                <option value="pool">Swimming Pool</option>
                <option value="gym">Fitness Center</option>
                <option value="spa">Spa & Wellness</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Location</label>
              <select
                value={hotelFilters.location}
                onChange={(e) => setHotelFilters({ ...hotelFilters, location: e.target.value })}
                className="w-full bg-gray-700 text-white text-xs rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="all">All Areas</option>
                <option value="city">City Center</option>
                <option value="airport">Near Airport</option>
                <option value="beach">Beachfront</option>
                <option value="business">Business District</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="px-4 py-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Hotels in {currentDest.name}</h2>
            <p className="text-gray-400 text-sm">
              {tripData.duration} nights • {tripData.hotelBudget} category
            </p>
          </div>

          <div className="space-y-4">
            {mockHotels[tripData.destination as keyof typeof mockHotels]?.map((hotel, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="mb-3">
                  <div className="font-semibold text-white text-lg mb-2">{hotel.name}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(hotel.rating) ? "text-yellow-400 fill-current" : "text-gray-400"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">{hotel.rating}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {hotel.amenities.map((amenity) => (
                      <span key={amenity} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="text-2xl font-bold text-white">₹{hotel.pricePerNight.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">per night + taxes</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-400">
                      ₹{(hotel.pricePerNight * tripData.duration).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">total for {tripData.duration} nights</div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedHotel(hotel)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    selectedHotel?.name === hotel.name
                      ? "bg-green-600 text-white"
                      : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  }`}
                >
                  {selectedHotel?.name === hotel.name ? "Booked" : "Book Hotel"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedHotel && (
          <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4">
            <div className="flex justify-between items-center text-white">
              <div>
                <div className="font-semibold">{selectedHotel.name} booked</div>
                <div className="text-sm opacity-90">
                  Total: ₹{(selectedHotel.pricePerNight * tripData.duration).toLocaleString()}
                </div>
              </div>
              <button onClick={navigateToHome} className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold">
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (currentScreen === "attractions") {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-4 flex items-center gap-3">
          <button onClick={navigateToHome} className="text-purple-400">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-lg font-bold">Tours & Attractions</h1>
        </div>

        {/* Attractions List */}
        <div className="px-4 py-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Top Attractions in {currentDest.name}</h2>
            <p className="text-gray-400 text-sm">Discover the best experiences</p>
          </div>

          <div className="space-y-4">
            {mockAttractions[tripData.destination as keyof typeof mockAttractions]?.map((attraction) => (
              <div key={attraction.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                <img
                  src={attraction.image || "/placeholder.svg"}
                  alt={attraction.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg mb-1">{attraction.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{attraction.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{attraction.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{attraction.duration}</span>
                    </div>
                    <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">{attraction.category}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xl font-bold text-white">
                        {attraction.price === 0 ? "Free" : `₹${attraction.price.toLocaleString()}`}
                      </div>
                      {attraction.price > 0 && <div className="text-xs text-gray-400">per person</div>}
                    </div>
                    <button
                      onClick={() => {
                        const isSelected = selectedAttractions.some((a) => a.id === attraction.id)
                        if (isSelected) {
                          setSelectedAttractions((prev) => prev.filter((a) => a.id !== attraction.id))
                        } else {
                          setSelectedAttractions((prev) => [...prev, attraction])
                        }
                      }}
                      className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                        selectedAttractions.some((a) => a.id === attraction.id)
                          ? "bg-green-600 text-white"
                          : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                      }`}
                    >
                      {selectedAttractions.some((a) => a.id === attraction.id) ? "Added" : "Add to Trip"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedAttractions.length > 0 && (
            <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4">
              <div className="flex justify-between items-center text-white">
                <div>
                  <div className="font-semibold">{selectedAttractions.length} attractions selected</div>
                  <div className="text-sm opacity-90">
                    Total: ₹
                    {(
                      selectedAttractions.reduce((sum, attr) => sum + attr.price, 0) * tripData.travelers
                    ).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={navigateToHome}
                  className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (currentScreen === "forex") {
    const forexRec = getForexRecommendations()

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-4 flex items-center gap-3">
          <button onClick={navigateToHome} className="text-purple-400">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-lg font-bold">Forex Cash Recommendations</h1>
        </div>

        {/* Forex Recommendations */}
        <div className="px-4 py-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Cash Needed for {currentDest.name}</h2>
            <p className="text-gray-400 text-sm">
              {tripData.duration} days • {tripData.travelers} travelers
            </p>
          </div>

          {/* Recommended Amount */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-6 mb-6">
            <div className="text-center">
              <div className="text-sm text-green-100 mb-2">Recommended Amount</div>
              <div className="text-3xl font-bold text-white mb-2">
                {forexRec.currency} {forexRec.recommended}
              </div>
              <div className="text-green-100 text-sm">
                ≈ ₹{(forexRec.recommended * getCurrentRate(forexRec.currency)).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Daily Expense Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍽️</span>
                  <span className="text-gray-300">Food & Dining</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {forexRec.currency} {forexRec.breakdown.food}
                  </div>
                  <div className="text-xs text-gray-400">
                    {currentDest.dailyCash.food} per day × {tripData.duration} days × {tripData.travelers} people
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚌</span>
                  <span className="text-gray-300">Local Transport</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {forexRec.currency} {forexRec.breakdown.transport}
                  </div>
                  <div className="text-xs text-gray-400">
                    {currentDest.dailyCash.transport} per day × {tripData.duration} days × {tripData.travelers} people
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛍️</span>
                  <span className="text-gray-300">Shopping & Misc</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {forexRec.currency} {forexRec.breakdown.misc}
                  </div>
                  <div className="text-xs text-gray-400">
                    {currentDest.dailyCash.misc} per day × {tripData.duration} days × {tripData.travelers} people
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🛡️</span>
                    <span className="text-gray-300">Safety Buffer (20%)</span>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">
                      {forexRec.currency} {forexRec.breakdown.buffer}
                    </div>
                    <div className="text-xs text-gray-400">Emergency fund</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rate Comparison */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Best Exchange Rates</h3>
            <div className="space-y-3">
              {Object.entries(competitorRates).map(([provider, data]) => {
                const isNiyo = provider === "Niyo"
                const finalRate = data.rate * (1 + data.markup)
                return (
                  <div
                    key={provider}
                    className={`p-3 rounded-xl border ${
                      isNiyo
                        ? "bg-gradient-to-r from-green-600 to-emerald-700 border-green-400"
                        : "bg-gray-700 border-gray-600"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className={`font-semibold ${isNiyo ? "text-white" : "text-gray-300"}`}>
                          {provider === "TraditionalBank" ? "Traditional Banks" : provider}
                          {isNiyo && <span className="ml-2">👑</span>}
                        </div>
                        <div className={`text-xs ${isNiyo ? "text-green-100" : "text-gray-400"}`}>
                          {(data.markup * 100).toFixed(1)}% markup + ₹{data.fee} fee
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${isNiyo ? "text-white" : "text-gray-200"}`}>
                          ₹{finalRate.toFixed(2)}
                        </div>
                        <div className={`text-xs ${isNiyo ? "text-green-100" : "text-gray-400"}`}>
                          per {forexRec.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Forex Button */}
          <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg">
            Order {forexRec.currency} {forexRec.recommended} Cash
          </button>
        </div>
      </div>
    )
  }

  // Home screen (existing code with clickable icons)
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Status Bar */}
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <span>6:21</span>
          <span>📷</span>
          <span>☁️</span>
          <span>📧</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🔔</span>
          <span>📶</span>
          <span>VoLTE</span>
          <span>📶</span>
          <span>61%</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Header with Niyo Coins */}
      <div className="bg-gray-900 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-gray-400">👤</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-gray-400">💬</span>
            </div>
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-gray-400">🔔</span>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-full flex items-center gap-2">
              <span className="text-white font-bold">N</span>
              <span className="text-white font-semibold">{(niyoCoins / 10).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Live Forex Rates Ticker */}
        <div className="bg-blue-600 text-white px-3 py-2 rounded-lg mb-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="bg-blue-500 px-2 py-1 rounded text-xs">Live</span>
            <span>EUR ₹{getCurrentRate("EUR").toFixed(2)}</span>
            <span>USD ₹{getCurrentRate("USD").toFixed(2)}</span>
            <span>GBP ₹{getCurrentRate("GBP").toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-md mx-auto bg-gray-900 min-h-screen">
        {/* Travel the Niyo Way Section */}
        <div className="px-4 mb-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
            <h1 className="text-2xl font-bold text-white mb-2">
              Travel the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Niyo</span>{" "}
              way
            </h1>
            <p className="text-gray-400 text-sm mb-6">Plan your perfect trip with smart recommendations</p>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <button onClick={navigateToFlights} className="text-center group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Plane className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-gray-300">Flights</span>
              </button>
              <button onClick={navigateToHotels} className="text-center group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Hotel className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-gray-300">Hotels</span>
              </button>
              <button onClick={navigateToAttractions} className="text-center group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-gray-300">Attractions</span>
              </button>
              <button onClick={navigateToForex} className="text-center group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-gray-300">Forex</span>
              </button>
            </div>
          </div>
        </div>

        {/* Trip Planning Form */}
        <div className="px-4 mb-6">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-400" />
              Plan Your Trip
            </h2>

            <div className="space-y-4">
              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Destination</label>
                <select
                  value={tripData.destination}
                  onChange={(e) => setTripData((prev) => ({ ...prev, destination: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Object.entries(destinations).map(([key, dest]) => (
                    <option key={key} value={key} className="bg-gray-700">
                      {dest.flag} {dest.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                  {loading.forex ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Updating rates...
                    </>
                  ) : (
                    <>
                      💱 Live rate: ₹{getCurrentRate(currentDest.currency as any).toFixed(2)} per {currentDest.currency}
                    </>
                  )}
                </div>
              </div>

              {/* Travel Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Departure</label>
                  <input
                    type="date"
                    value={selectedDates.departure.toISOString().split("T")[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value)
                      setSelectedDates((prev) => ({
                        ...prev,
                        departure: newDate,
                        return: new Date(newDate.getTime() + tripData.duration * 24 * 60 * 60 * 1000),
                      }))
                    }}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Return</label>
                  <input
                    type="date"
                    value={selectedDates.return.toISOString().split("T")[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value)
                      setSelectedDates((prev) => ({ ...prev, return: newDate }))
                      const duration = Math.ceil(
                        (newDate.getTime() - selectedDates.departure.getTime()) / (1000 * 60 * 60 * 24),
                      )
                      setTripData((prev) => ({ ...prev, duration }))
                    }}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                    min={selectedDates.departure.toISOString().split("T")[0]}
                  />
                </div>
              </div>

              {/* Travelers */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Travelers</label>
                <select
                  value={tripData.travelers}
                  onChange={(e) => setTripData((prev) => ({ ...prev, travelers: Number.parseInt(e.target.value) }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "Traveler" : "Travelers"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mb-6">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-400" />
                Cash Recommendations
              </h3>
              <button onClick={navigateToForex} className="text-purple-400 text-sm flex items-center gap-1">
                View Details <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {(() => {
              const forexRec = getForexRecommendations()
              return (
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-4">
                  <div className="text-center mb-3">
                    <div className="text-sm text-green-100 mb-1">Recommended Cash</div>
                    <div className="text-2xl font-bold text-white">
                      {forexRec.currency} {forexRec.recommended}
                    </div>
                    <div className="text-green-100 text-sm">
                      ≈ ₹{(forexRec.recommended * getCurrentRate(forexRec.currency)).toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-green-100">
                    <div className="text-center">
                      <div className="font-semibold">🍽️ Food</div>
                      <div>
                        {forexRec.currency} {forexRec.breakdown.food}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">🚌 Transport</div>
                      <div>
                        {forexRec.currency} {forexRec.breakdown.transport}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">🛍️ Shopping</div>
                      <div>
                        {forexRec.currency} {forexRec.breakdown.misc}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {selectedAttractions.length > 0 && (
          <div className="px-4 mb-6">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-purple-400" />
                  Selected Attractions
                </h3>
                <button onClick={navigateToAttractions} className="text-purple-400 text-sm flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {selectedAttractions.slice(0, 2).map((attraction) => (
                  <div key={attraction.id} className="bg-gray-700 rounded-xl p-3 border border-gray-600">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm">{attraction.name}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span>{attraction.rating}</span>
                          <span>•</span>
                          <span>{attraction.duration}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">
                          {attraction.price === 0 ? "Free" : `₹${attraction.price.toLocaleString()}`}
                        </div>
                        {attraction.price > 0 && <div className="text-xs text-gray-400">per person</div>}
                      </div>
                    </div>
                  </div>
                ))}
                {selectedAttractions.length > 2 && (
                  <div className="text-center text-gray-400 text-sm">
                    +{selectedAttractions.length - 2} more attractions
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Flight Options */}
        {flightDetails[tripData.destination] && (
          <div className="px-4 mb-6">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plane className="h-5 w-5 text-blue-400" />
                  Flight Options
                </h3>
                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">Cheapest</div>
              </div>

              <div className="space-y-3">
                {flightDetails[tripData.destination].slice(0, 3).map((flight: any) => (
                  <div key={flight.id} className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">6E</span>
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{flight.airline}</div>
                          <div className="text-xs text-gray-400">{flight.airlineCode}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">₹{flight.price.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">per adult</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="font-medium text-white">{flight.departure.time}</div>
                          <div className="text-xs text-gray-400">{flight.departure.airport}</div>
                        </div>
                        <div className="flex flex-col items-center text-gray-400">
                          <div className="text-xs">{flight.duration}</div>
                          <div className="w-8 h-px bg-gray-500 my-1"></div>
                          <div className="text-xs">{flight.stops === 0 ? "Non-Stop" : `${flight.stops}-Stop`}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-white">{flight.arrival.time}</div>
                          <div className="text-xs text-gray-400">{flight.arrival.airport}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hotel Options */}
        {hotelDetails[tripData.destination] && hotelDetails[tripData.destination].length > 0 && (
          <div className="px-4 mb-6">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Hotel className="h-5 w-5 text-purple-400" />
                  Hotel Options
                </h3>
                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">Lowest Price</div>
              </div>

              <div className="space-y-3">
                {hotelDetails[tripData.destination].slice(0, 3).map((hotel: any, index: number) => (
                  <div key={index} className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm mb-1">{hotel.name}</div>
                        <div className="flex items-center gap-1 mb-2">
                          <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                            {hotel.rating || 4.3} Very Good
                          </div>
                          <span className="text-xs text-gray-400">
                            • {Math.floor(Math.random() * 3000 + 1000)} ratings
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          {destinations[tripData.destination as keyof typeof destinations].name} • 4.4 km from map
                          center
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {["Terrace", "Wifi", "Parking", "Elevator"].map((amenity) => (
                            <span key={amenity} className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-xl font-bold text-white">
                          ₹{(hotel.pricePerNight || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          + ₹{Math.floor((hotel.pricePerNight || 0) * 0.18).toLocaleString()} taxes & fees per night
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trip Cost Breakdown */}
        <div className="px-4 mb-6">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Trip Cost Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300 text-sm">
                  Flights ({tripData.flightBudget}) - {tripData.travelers} travelers
                </span>
                <span className="font-semibold text-white">₹{results.flightCost?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300 text-sm">
                  Hotels ({tripData.hotelBudget}) - {tripData.duration} nights
                </span>
                <span className="font-semibold text-white">₹{results.hotelCost?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300 text-sm">Attractions ({selectedAttractions.length} selected)</span>
                <span className="font-semibold text-white">₹{results.attractionsCost?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300 text-sm">Cash for daily expenses</span>
                <span className="font-semibold text-white">₹{results.cashCost?.toLocaleString()}</span>
              </div>

              {/* Niyo Coins Discount */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-yellow-400 font-medium flex items-center gap-2 text-sm">
                    🪙 Niyo Coins Discount
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs">Up to 75%</span>
                  </span>
                  <span className="font-bold text-yellow-400">-₹{results.coinDiscount?.toLocaleString()}</span>
                </div>
                <div className="text-xs text-yellow-300">
                  Using {Math.round((results.coinDiscount || 0) * 10).toLocaleString()} coins
                </div>
              </div>

              <div className="flex justify-between py-3 text-lg font-bold text-green-400 border-t border-gray-700">
                <span>Final Trip Cost</span>
                <span>₹{results.finalCost?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Competitor Comparison */}
        <div className="px-4 mb-6">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Why Choose Niyo?</h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {Object.entries(competitorRates)
                .slice(0, 4)
                .map(([key, data]) => {
                  const isNiyo = key === "Niyo"
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-xl border ${
                        isNiyo
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400"
                          : "bg-gray-700 border-gray-600"
                      }`}
                    >
                      <div className={`font-semibold text-sm mb-1 ${isNiyo ? "text-white" : "text-gray-300"}`}>
                        {key === "TraditionalBank" ? "Banks" : key}
                        {isNiyo && <span className="ml-1">👑</span>}
                      </div>
                      <div className={`text-xs mb-1 ${isNiyo ? "text-green-100" : "text-gray-400"}`}>
                        {(data.markup * 100).toFixed(1)}% markup
                      </div>
                      <div className={`text-lg font-bold ${isNiyo ? "text-white" : "text-gray-200"}`}>
                        ₹{data.fee?.toLocaleString()}
                      </div>
                    </div>
                  )
                })}
            </div>

            <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-4 text-white">
              <div className="text-center mb-3">
                <div className="text-lg font-bold">🎉 You Save ₹{results.cardSavings?.toLocaleString()}</div>
                <div className="text-sm opacity-90">vs traditional banks</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-green-300 rounded-full"></div>
                  <span>Lowest forex markup</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-green-300 rounded-full"></div>
                  <span>Earn Niyo Coins</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-green-300 rounded-full"></div>
                  <span>Zero weekend markup</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-green-300 rounded-full"></div>
                  <span>24/7 support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="px-4 pb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Get Your Niyo Card</h2>
            <p className="text-blue-100 text-sm mb-4">Start saving on international transactions</p>
            <button className="w-full bg-white text-blue-600 font-semibold py-3 rounded-xl hover:bg-gray-100 transition-colors">
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
