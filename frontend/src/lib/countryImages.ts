/**
 * Utility to dynamically load country images from assets folder
 * Images should be named with lowercase country name (e.g., germany.jpg, romania.jpg)
 */

// Import all country images
import germanImage from '@/assets/german.jpg'
import romaniaImage from '@/assets/romania.jpg'

// Map country names to their images
const countryImageMap: Record<string, string> = {
  'Germany': germanImage,
  'Romania': romaniaImage,
  // Add more countries as images become available
}

/**
 * Get the image URL for a country
 * @param countryName - The name of the country
 * @returns The image URL or null if not found
 */
export function getCountryImage(countryName: string): string | null {
  if (!countryName) return null
  
  // Try exact match first
  if (countryImageMap[countryName]) {
    return countryImageMap[countryName]
  }
  
  // Try case-insensitive match
  const normalizedName = countryName.toLowerCase()
  const matchedKey = Object.keys(countryImageMap).find(
    key => key.toLowerCase() === normalizedName
  )
  
  return matchedKey ? countryImageMap[matchedKey] : null
}

/**
 * Check if a country has an image available
 * @param countryName - The name of the country
 * @returns true if image exists, false otherwise
 */
export function hasCountryImage(countryName: string): boolean {
  return getCountryImage(countryName) !== null
}

/**
 * Get all available country names that have images
 * @returns Array of country names
 */
export function getAvailableCountries(): string[] {
  return Object.keys(countryImageMap)
}
