import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '@/content/LanguageContext'
import { fetchUserDashboard, fetchJobSites, fetchPopularCountries } from '../../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, MapPin, Briefcase, Globe, Star, ChevronRight, Copy, Check } from 'lucide-react'
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

export default function Dashboard() {
  const { user } = useAuth()
  const { content } = useLanguage()
  const navigate = useNavigate()
  const [country, setCountry] = useState<string>('')
  const [sites, setSites] = useState<JobSite[]>([])
  const [allSites, setAllSites] = useState<JobSite[]>([])
  const [popularCountries, setPopularCountries] = useState<PopularCountry[]>([])
  const [showAllCountries, setShowAllCountries] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

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
    (async () => {
      setLoading(true)
      try {
        // Fetch dashboard data (includes user's country and filtered job sites)
        // UserGuard ensures only users with active subscriptions can access this
        const dashboardRes = await fetchUserDashboard()
        if (dashboardRes.ok) {
          setCountry(dashboardRes.country || '')
          setSites(dashboardRes.job_sites || [])
        }

        // Fetch popular countries
        const popularRes = await fetchPopularCountries()
        if (popularRes.ok && popularRes.popular_countries) {
          setPopularCountries(popularRes.popular_countries)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleViewAllCountries = async () => {
    if (showAllCountries) {
      // Reset to user's country sites
      setShowAllCountries(false)
      if (country) {
        await handleViewCountry(country)
      } else {
        // If no country, fetch user dashboard again
        setLoading(true)
        try {
          const dashboardRes = await fetchUserDashboard()
          if (dashboardRes.ok) {
            setSites(dashboardRes.job_sites || [])
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error)
        } finally {
          setLoading(false)
        }
      }
      return
    }

    setLoading(true)
    try {
      const res = await fetchJobSites()
      // Handle different response formats
      if (res.ok) {
        const jobSites = res.results || res.data || (Array.isArray(res) ? res : [])
        setAllSites(jobSites)
      }
      setShowAllCountries(true)
    } catch (error) {
      console.error('Error fetching all job sites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewCountry = (countryName: string) => {
    // Navigate to /sites page with country parameter
    navigate(`/sites?country=${encodeURIComponent(countryName)}`)
  }

  const displaySites = showAllCountries ? allSites : sites

  // Get user name from various possible properties
  const userName = user?.name || (user as any)?.first_name || (user as any)?.username || ''

  return (
    <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {content.dashboard.welcome}{userName ? `, ${userName}` : ''}! 🎉
          </h1>
          <p className="text-lg text-muted-foreground">
            {content.dashboard.welcomeSubtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Country Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{content.dashboard.targetCountry}</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {country && <span className="text-3xl">{getCountryFlag(country)}</span>}
                <div className="text-2xl font-bold">{country || '—'}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {content.dashboard.preferredDestination}
              </p>
            </CardContent>
          </Card>

          {/* Job Sites Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{content.dashboard.availableJobSites}</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displaySites.length}</div>
              <p className="text-xs text-muted-foreground">
                {showAllCountries ? content.dashboard.allCountries : content.dashboard.curatedForProfile}
              </p>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{content.dashboard.accountStatus}</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{content.dashboard.active}</div>
              <Badge variant="secondary" className="text-xs">
                {content.dashboard.premiumAccess}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Job Sites Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {showAllCountries ? content.dashboard.allJobSites : content.dashboard.curatedJobSites}
                </CardTitle>
                <CardDescription>
                  {showAllCountries 
                    ? content.dashboard.browseAllCountries
                    : country 
                      ? `${content.dashboard.handPickedForCountry} ${country}.`
                      : content.dashboard.handPickedTailored}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={handleViewAllCountries}
                disabled={loading}
              >
                {showAllCountries ? content.dashboard.showMyCountry : content.dashboard.viewAllCountries}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">{content.dashboard.loadingJobSites}</p>
              </div>
            ) : displaySites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {displaySites.map(site => {
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
                              className="flex-1 h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl text-xs font-semibold transition-all"
                            >
                              <a
                                href={site.site_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5"
                              >
                                Go to Site
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
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{content.dashboard.noJobSitesYet}</h3>
                <p className="text-muted-foreground">
                  {country 
                    ? `${content.dashboard.workingOnAdding} ${country}. ${content.dashboard.checkBackSoon}`
                    : content.dashboard.workingOnCurating}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Countries Section */}
        {popularCountries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                {content.dashboard.popularCountries}
              </CardTitle>
              <CardDescription>
                {content.dashboard.explorePopularDestinations}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {popularCountries.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="flex items-center gap-3 h-auto py-4 px-4 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 group"
                    onClick={() => handleViewCountry(item.country)}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                      {getCountryFlag(item.country)}
                    </span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-sm">{item.country}</div>
                      <div className="text-xs text-muted-foreground group-hover:text-white/80">
                        {item.site_count} {item.site_count === 1 ? content.dashboard.site : content.dashboard.sites}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
