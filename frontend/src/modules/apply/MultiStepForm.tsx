import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../../services/api'
import { useAuth } from '../auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, CreditCard, User, MapPin, Loader2, Eye, EyeOff } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useLanguage } from '@/content/LanguageContext'

export type ApplicationData = {
  first_name: string
  last_name: string
  username: string
  email: string
  phone_number: string
  password?: string
  age: string
  country: string
  desiredJob: string
  desiredStartDate: string
}

// Job options by country
const jobsByCountry: Record<string, string[]> = {
  'Poland': ['Warehouse Worker', 'Factory Line Operator', 'Agricultural Laborer (Farm Worker)', 'Construction Helper', 'Cleaner', 'Kitchen Assistant'],
  'Germany': ['Logistics/Warehouse Assistant', 'Construction Laborer', 'Caregiver/Support Worker', 'Cleaning Staff', 'Food Processing Line Worker'],
  'Netherlands': ['Greenhouse Worker (Horticulture)', 'Warehouse/Logistics Assistant', 'Factory Line Operator'],
  'Spain': ['Seasonal Agricultural Worker (Fruit Picker)', 'Hotel Housekeeping', 'Industrial Cleaner', 'Delivery Worker'],
  'Italy': ['Seasonal Farm Worker (Agriculture)', 'Hospitality (Kitchen Assistant, Housekeeping)'],
  'Luxembourg': ['Cleaning Staff', 'Construction Laborer', 'Warehouse/Factory Worker', 'Kitchen Helper'],
}

const initialData: ApplicationData = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone_number: '',
  password: '',
  age: '',
  country: '',
  desiredJob: '',
  desiredStartDate: '',
}

function StepIndicator({ step, total }: { step: number; total: number }) {
  const { currentLanguage } = useLanguage()
  const percent = Math.round((step / total) * 100)
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between text-sm mb-2 text-muted-foreground">
        <span>{currentLanguage === 'am' ? `ደረጃ ${step} ከ ${total}` : `Step ${step} of ${total}`}</span>
        <span>{percent}% {currentLanguage === 'am' ? 'ተጠናቋል' : 'Complete'}</span>
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  )
}

export default function MultiStepForm() {
  const { content, currentLanguage } = useLanguage()
  const { setToken, setUser } = useAuth()
  const [data, setData] = useState<ApplicationData>(initialData)
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const total = 2
  const navigate = useNavigate()

  const update = (patch: Partial<ApplicationData>) => setData(d => ({ ...d, ...patch }))

  const next = () => setStep(s => Math.min(total, s + 1))
  const back = () => setStep(s => Math.max(1, s - 1))

  const onSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In a more robust setup, the backend would handle user creation
      // and profile creation in a single, atomic transaction.
      // We send all the data in one go.
      const res = await registerUser(data) // Use the correct endpoint for registration

      if (res.ok || res.status === 201) {
        // Store the token if provided - use 'auth_access_token' to match api.ts
        const token = res.token || res.access
        if (token) {
          localStorage.setItem('auth_access_token', token)
          // Also store refresh token if provided
          if (res.refresh) {
            localStorage.setItem('auth_refresh_token', res.refresh)
          }
          
          // Update auth context
          setToken(token)
          if (res.user) {
            setUser({ 
              name: res.user.name || `${res.user.first_name || ''} ${res.user.last_name || ''}`.trim() || res.user.username,
              email: res.user.email 
            })
          }
        }

        // SUCCESS: User created. Redirect to payment page.
        // After payment is successful, user will be automatically logged in and taken to dashboard
        navigate('/payment', { 
          state: { 
            draftId: res.draft_id || 'temp', 
            email: data.email, 
            applicationData: data,
            userId: res.user?.id
          } 
        })
      } else {
        // Handle submission failure from the backend
        const errorMessage =
          res.error || res.username?.[0] || res.email?.[0] || 'Failed to submit application. Please check your details and try again.'
        setError(errorMessage)
      }
    } catch (e) {
      setError('An unexpected error occurred. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const validStep = () => {
    if (step === 1)
      return !!(
        data.first_name && // Personal Info
        data.last_name && //
        data.username && //
        data.email && //
        data.password && //
        data.password.length >= 8 && //
        data.phone_number && //
        data.age //
      )
    if (step === 2)
      return !!(data.country && data.desiredJob && data.desiredStartDate) // Job Preferences
    return false
  }

  const getStepIcon = (stepNum: number) => {
    switch (stepNum) {
      case 1: return <User className="h-5 w-5" />
      case 2: return <MapPin className="h-5 w-5" />
      default: return null
    }
  }

  const getStepTitle = (stepNum: number) => {
    switch (stepNum) {
      case 1: return content.onboardingForm.personalInfo
      case 2: return content.onboardingForm.jobPreferencesTitle
      default: return ''
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[calc(100vh-4rem)] py-12">
      <div className="max-w-2xl mx-auto px-4">
        <StepIndicator step={step} total={total} />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {getStepIcon(step)}
              <div>
                <CardTitle className="text-2xl">
                  {step === 1 ? `${content.onboardingForm.formTitle} ${step}` : getStepTitle(step)}
                </CardTitle>
                <CardDescription>
                  {step === 1 && content.onboardingForm.step1Instructions}
                  {step === 2 && content.onboardingForm.jobPreferencesSubtitle}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 1 && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{content.onboardingForm.firstNameLabel}</Label>
                  <Input
                    id="firstName"
                    placeholder={currentLanguage === 'am' ? 'ስምዎን ያስገቡ' : `Enter your ${content.onboardingForm.firstNameLabel.toLowerCase()}`}
                    value={data.first_name}
                    onChange={e => update({ first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{content.onboardingForm.lastNameLabel}</Label>
                  <Input
                    id="lastName"
                    placeholder={currentLanguage === 'am' ? 'የአባት ስምዎን ያስገቡ' : `Enter your ${content.onboardingForm.lastNameLabel.toLowerCase()}`}
                    value={data.last_name}
                    onChange={e => update({ last_name: e.target.value })}
                  />
                </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">{content.onboardingForm.usernameLabel}</Label>
                  <Input
                    id="username"
                    placeholder={currentLanguage === 'am' ? 'የተጠቃሚ ስምዎን ይምረጡ' : 'Choose a username'}
                    value={data.username}
                    onChange={e => update({ username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{content.onboardingForm.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={currentLanguage === 'am' ? 'ኢሜይል አድራሻዎን ያስገቡ' : `Enter your ${content.onboardingForm.emailLabel.toLowerCase()}`}
                    value={data.email}
                    onChange={e => update({ email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{content.onboardingForm.passwordLabel}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={currentLanguage === 'am' ? 'የይለፍ ቃል ይፍጠሩ (ቢያንስ 8 ቁምፊዎች)' : 'Create a password (min 8 characters)'}
                      value={data.password}
                      onChange={e => update({ password: e.target.value })}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{content.onboardingForm.phoneLabel}</Label>
                  <Input
                    id="phone"
                    placeholder={currentLanguage === 'am' ? 'ስልክ ቁጥርዎን ያስገቡ' : `Enter your ${content.onboardingForm.phoneLabel.toLowerCase()}`}
                    value={data.phone_number}
                    onChange={e => update({ phone_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">{currentLanguage === 'am' ? 'እድሜ' : 'Age'}</Label>
                  <Input
                    id="age"
                    type="number"
                    min="16"
                    max="65"
                    placeholder={currentLanguage === 'am' ? 'እድሜዎን ያስገቡ' : 'Enter your age'}
                    value={data.age}
                    onChange={e => update({ age: e.target.value })}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-6">
                {/* Country Selection with Radio Buttons */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">
                    {content.onboardingForm.preferredCountryLabel}
                  </Label>
                  <RadioGroup 
                    value={data.country} 
                    onValueChange={(value) => {
                      update({ country: value, desiredJob: '' }) // Reset job when country changes
                    }}
                    name="country"
                    className="grid grid-cols-2 gap-4"
                  >
                    {['Poland', 'Germany', 'Netherlands', 'Spain', 'Italy', 'Luxembourg'].map(country => (
                      <div key={country} className="flex items-center space-x-2">
                        <RadioGroupItem value={country} id={country} />
                        <Label htmlFor={country} className="cursor-pointer">{country}</Label>
                      </div>
                    ))}
                  </RadioGroup>

                </div>

                {/* Job Selection with Radio Buttons */}
                {data.country && jobsByCountry[data.country] && (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">
                      {currentLanguage === 'am' ? 'የሚፈልጉት ስራ' : 'Desired Job in ' + data.country}
                    </Label>
                    <RadioGroup 
                      value={data.desiredJob} 
                      onValueChange={(value) => update({ desiredJob: value })}
                      name="desiredJob"
                      className="grid gap-3"
                    >
                      {jobsByCountry[data.country].map(job => (
                        <div key={job} className="flex items-center space-x-2">
                          <RadioGroupItem value={job} id={job} />
                          <Label htmlFor={job} className="cursor-pointer text-sm">{job}</Label>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Other" id="Other" />
                        <Label htmlFor="Other" className="cursor-pointer text-sm">
                          {currentLanguage === 'am' ? 'ሌላ' : 'Other'}
                        </Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      {currentLanguage === 'am' 
                        ? 'በ' + data.country + ' ውስጥ ለኢትዮጵያውያን የተለመዱ የስራ እድሎች' 
                        : 'Common job opportunities in ' + data.country + ' for international workers'}
                    </p>
                  </div>
                )}



                <div className="space-y-2">
                  <Label htmlFor="startDate">{content.onboardingForm.desiredStartDateLabel}</Label>
                  <Input
                    id="startDate"
                    type="month"
                    value={data.desiredStartDate}
                    onChange={e => update({ desiredStartDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={back}
                disabled={step === 1 || isLoading}
                className="flex-1"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {content.onboardingForm.backButtonText}
              </Button>
              {step < total && (
                <Button
                  type="button"
                  onClick={next}
                  disabled={!validStep() || isLoading}
                  className="flex-1"
                >
                  {content.onboardingForm.nextButtonText}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {step === total && (
                <Button
                  type="button"
                  onClick={onSubmit}
                  disabled={!validStep() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {currentLanguage === 'am' ? 'በማቀናበር ላይ...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      {content.onboardingForm.continueToPayment}
                      <CreditCard className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
