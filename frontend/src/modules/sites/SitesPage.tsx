import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '@/content/LanguageContext'
import { useAuth } from '../auth/AuthContext'
import { fetchJobSites, fetchPopularCountries } from '../../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe, ExternalLink, MapPin, Briefcase, Copy, Check, Search, LayoutDashboard, Sparkles } from 'lucide-react'
import { getCountryFlag } from '@/lib/countryFlags'
import { getCountryImage } from '@/lib/countryImages'

interface JobSite { 
  id: number
  country: string
  site_name: string
  site_url: string
}

interface PopularCountry {
  country: string
  site_count: number
}

export default function SitesPage() {
  const { content } = useLanguage()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [selectedCountry, setSelectedCountry] = useState<string>(searchParams.get('country') || 'all')
  const [sites, setSites] = useState<JobSite[]>([])
  const [popularCountries, setPopularCountries] = useState<PopularCountry[]>([])
  const [loading, setLoading] = useState(true)
  const [allCountries, setAllCountries] = useState<string[]>([])
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  useEffect(() => {
    // Read country from URL params on initial load
    const countryParam = searchParams.get('country')
    const countryValue = countryParam || 'all'
    if (countryValue !== selectedCountry) {
      setSelectedCountry(countryValue)
    }
    // Load all sites on initial mount if no country in URL
    if (!countryParam) {
      loadAllSites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Fetch popular countries first, then load sites
    const fetchInitialData = async () => {
      try {
        const popularRes = await fetchPopularCountries()
        if (popularRes.ok && popularRes.popular_countries) {
          setPopularCountries(popularRes.popular_countries)
          // Extract unique countries from popular countries
          const countries = popularRes.popular_countries.map((c: PopularCountry) => c.country)
          setAllCountries(countries)
        }
      } catch (error) {
        console.error('Error fetching popular countries:', error)
      }
    }

    fetchInitialData()
  }, [])

  useEffect(() => {
    // Load sites when country selection changes
    const loadSites = async () => {
      if (selectedCountry && selectedCountry !== 'all') {
        await loadSitesForCountry(selectedCountry)
      } else {
        // If 'all' selected or no country, show all sites
        await loadAllSites()
      }
    }

    loadSites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry])

  const loadSitesForCountry = async (country: string) => {
    setLoading(true)
    try {
      const res = await fetchJobSites(country)
      console.log('Job sites response for country:', country, res)
      
      // Handle different response formats
      let jobSites: JobSite[] = []
      if (res.results && Array.isArray(res.results)) {
        jobSites = res.results
      } else if (res.data && Array.isArray(res.data)) {
        jobSites = res.data
      } else if (Array.isArray(res)) {
        jobSites = res
      } else if (res.ok || res.status === 200) {
        // If response is ok but no data structure, try to extract from response
        jobSites = []
      }
      
      console.log('Parsed job sites:', jobSites)
      setSites(jobSites)
    } catch (error) {
      console.error('Error fetching job sites:', error)
      setSites([])
    } finally {
      setLoading(false)
    }
  }

  const loadAllSites = async () => {
    setLoading(true)
    try {
      // Fetch all sites without country filter
      const res = await fetchJobSites()
      console.log('All job sites response:', res)
      
      // Handle different response formats
      let jobSites: JobSite[] = []
      if (res.results && Array.isArray(res.results)) {
        jobSites = res.results
      } else if (res.data && Array.isArray(res.data)) {
        jobSites = res.data
      } else if (Array.isArray(res)) {
        jobSites = res
      } else if (res.ok || res.status === 200) {
        // If response is ok but no data structure, try to extract from response
        jobSites = []
      }
      
      console.log('Parsed all job sites:', jobSites)
      setSites(jobSites)
      
      // Extract unique countries from all sites and add to country list
      if (jobSites.length > 0) {
        const uniqueCountries = [...new Set(jobSites.map(site => site.country).filter(Boolean))].sort()
        setAllCountries(prev => {
          const combined = [...new Set([...prev, ...uniqueCountries])]
          return combined.sort()
        })
      }
    } catch (error) {
      console.error('Error fetching all job sites:', error)
      setSites([])
    } finally {
      setLoading(false)
    }
  }

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country)
    // Update URL when country changes
    if (country && country !== 'all') {
      setSearchParams({ country: country })
    } else {
      setSearchParams({})
    }
  }

  // Filter sites based on search query
  const filteredSites = sites.filter(site => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      site.site_name.toLowerCase().includes(query) ||
      site.country.toLowerCase().includes(query) ||
      site.site_url.toLowerCase().includes(query)
    )
  })

  return (
    <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-4 shadow-md border border-blue-100">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-semibold text-primary">Global Job Opportunities</span>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent mb-3">
                {content.sites.title}
              </h1>
              <p className="text-xl text-gray-700 font-medium">
                {content.sites.subtitle}
              </p>
            </div>
            {user && (
              <Button asChild variant="outline" className="hidden sm:flex shadow-md hover:shadow-lg transition-all">
                <Link to="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Search and Country Selector */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Search Bar */}
          <Card className="bg-white/90 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-all rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Search className="h-4 w-4 text-white" />
                </div>
                {content.sites.searchSites}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder={content.sites.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-2 focus:border-primary rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Country Selector */}
          <Card className="bg-white/90 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-all rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                {content.sites.selectCountry}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                  <SelectTrigger className="w-full h-11 border-2 rounded-xl">
                    <SelectValue placeholder={content.sites.allCountries} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2 font-semibold">
                        <Globe className="h-4 w-4" />
                        {content.sites.allCountries}
                      </span>
                    </SelectItem>
                    {allCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{getCountryFlag(country)}</span>
                          {country}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCountry && selectedCountry !== 'all' && (
                  <Badge className="text-sm whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-md px-3 py-1">
                    {sites.length} {sites.length === 1 ? content.sites.siteFound : content.sites.sitesFound}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sites Grid */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">{content.sites.loadingSites}</p>
              </div>
            </CardContent>
          </Card>
        ) : sites.length > 0 ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedCountry && selectedCountry !== 'all'
                    ? `${content.sites.title} - ${selectedCountry}`
                    : `${content.sites.title} - ${content.sites.allCountries}`}
                </h2>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `${filteredSites.length} of ${sites.length} ${filteredSites.length === 1 ? content.sites.siteFound : content.sites.sitesFound}`
                    : `${sites.length} ${sites.length === 1 ? content.sites.siteFound : content.sites.sitesFound}`}
                </p>
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                >
                  {content.sites.clearSearch}
                </Button>
              )}
            </div>
            {filteredSites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredSites.map(site => {
                  const countryImage = getCountryImage(site.country)
                  return (
                    <Card 
                      key={site.id} 
                      className="group relative border-none rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                    >
                      {/* Country Image with Overlay */}
                      {countryImage ? (
                        <div className="relative h-48 overflow-hidden">
                          <img 
                            src={countryImage} 
                            alt={site.country}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </div>
                      ) : (
                        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-6xl opacity-90 transition-transform duration-300 group-hover:scale-110">{getCountryFlag(site.country)}</span>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        </div>
                      )}
                      
                      {/* Blurred Footer Overlay - Hero UI Style */}
                      <div className="absolute bottom-1 left-1 right-1 z-10">
                        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 shadow-2xl">
                          <div className="flex items-center justify-between gap-3 mb-2.5">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">
                                {site.site_name}
                              </h3>
                              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                <span className="text-base">{getCountryFlag(site.country)}</span>
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{site.country}</span>
                              </div>
                            </div>
                            <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              asChild
                              size="sm"
                              className="flex-1 h-8  hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl text-xs font-semibold transition-all"
                            >
                              <a
                                href={site.site_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5"
                              >
                                Visit Site
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
                              onClick={() => copyToClipboard(site.site_url)}
                              title={copiedUrl === site.site_url ? content.sites.linkCopied : content.sites.copyLink}
                            >
                              {copiedUrl === site.site_url ? (
                                <Check className="h-3 w-3 text-green-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{content.sites.noSitesMatch}</h3>
                    <p className="text-muted-foreground mb-4">
                      {content.sites.noSitesMatchQuery} "{searchQuery}"
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      {content.sites.clearSearch}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{content.sites.noSitesFound}</h3>
                <p className="text-muted-foreground">
                  {selectedCountry && selectedCountry !== 'all'
                    ? `${content.sites.noSitesForCountry} ${selectedCountry}. ${content.dashboard.checkBackSoon}`
                    : content.dashboard.workingOnCurating}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Popular Countries Section */}
        {popularCountries.length > 0 && (
          <Card className="mt-8 bg-white border border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-xl">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-white" />
                </div>
                {content.dashboard.popularCountries}
              </CardTitle>
              <CardDescription className="text-sm">
                {content.dashboard.explorePopularDestinations}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {popularCountries.map((item, index) => {
                  const countryImage = getCountryImage(item.country)
                  return (
                    <div
                      key={index}
                      className="group relative border-none rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                      onClick={() => {
                        setSelectedCountry(item.country)
                        navigate(`/sites?country=${encodeURIComponent(item.country)}`)
                      }}
                    >
                      {countryImage ? (
                        <div className="relative h-32 overflow-hidden">
                          <img 
                            src={countryImage} 
                            alt={item.country}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                              {getCountryFlag(item.country)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative h-32 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-4xl transition-transform duration-300 group-hover:scale-110">
                            {getCountryFlag(item.country)}
                          </span>
                        </div>
                      )}
                      
                      {/* Blurred Footer Overlay */}
                      <div className="absolute bottom-1 left-1 right-1 z-10">
                        <div className="bg-gray-900/75 backdrop-blur-lg border border-gray-700/40 rounded-lg p-2 shadow-xl">
                          <div className="font-semibold text-xs text-white mb-0.5 truncate">
                            {item.country}
                          </div>
                          <div className="text-[10px] text-gray-300 flex items-center gap-1">
                            <Briefcase className="h-2.5 w-2.5" />
                            {item.site_count} {item.site_count === 1 ? 'site' : 'sites'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

