// src\utils\locationUtils.js

// Import the india-district-node.js module with district coordinates data
const { calculateDistance, getCoordinates, indiaDistricts } = require('./india-district-node');

/**
 * Calculate distance score based on the distance between two districts
 * @param {number} distance - Distance in kilometers between two locations
 * @returns {number} - Score between 0 and 5 based on distance ranges
 */
function calculateDistanceScore(distance) {
  // Apply the scoring logic based on distance ranges
  if (distance === 0) {
    return 5;    // Equal to 0
  } else if (distance > 0 && distance <= 25) {
    return 4.5;  // Between 1 to 25 KM
  } else if (distance > 25 && distance <= 50) {
    return 4;    // Between 26 to 50 KM (assuming typo in "62 to 50 KM")
  } else if (distance > 50 && distance <= 100) {
    return 3;    // Between 51 to 100 KM
  } else if (distance > 100 && distance <= 150) {
    return 2;    // Between 100 to 150 KM
  } else if (distance > 150 && distance < 250) {
    return 1;    // Between 150 KM and 250 KM
  } else {
    return 0;    // >= 250 KM
  }
}

/**
 * Get location score based on district codes or names
 * @param {string|number} userDistrict - User's district code or name
 * @param {string|number} matchDistrict - Match's district code or name
 * @returns {number} - Score between 0 and 5
 */
function getLocationScore(userDistrict, matchDistrict) {
  // Handle if district codes are provided as numbers instead of strings
  userDistrict = String(userDistrict);
  matchDistrict = String(matchDistrict);
  
  // If the districts are the same, return perfect score
  if (userDistrict === matchDistrict) {
    return 5;
  }
  
  // Get district names from the district mapping
  const userDistrictName = getDistrictName(userDistrict);
  const matchDistrictName = getDistrictName(matchDistrict);
  
  // If district names not found or invalid, return 0
  if (!userDistrictName || !matchDistrictName) {
    return 0; // Unable to calculate distance
  }
  
  try {
    // Calculate distance between districts
    const distance = calculateDistance(userDistrictName, matchDistrictName);
    
    // If distance calculation failed, return 0
    if (typeof distance === 'string') {
      return 0; // Error message was returned instead of distance
    }
    
    // Apply scoring logic based on distance
    return calculateDistanceScore(distance);
  } catch (error) {
    // If any error occurs, return 0
    console.error(`Error calculating location score: ${error.message}`);
    return 0;
  }
}

/**
 * Map district code to district name
 * @param {string} districtCode - District code
 * @returns {string|null} - District name or null if not found
 */
function getDistrictName(districtCode) {
  // This should be replaced with your actual district code to name mapping
  // Example implementation:
  const districtMapping = {
    '248': 'Delhi',
    '249': 'Mumbai',
    '250': 'Chennai',
    '251': 'Kolkata',
    '252': 'Bangalore',
    '254': 'Hyderabad',
    '255': 'Ahmedabad',
    '256': 'Pune',
    '257': 'Jaipur',
    '258': 'Lucknow',
    '259': 'Kanpur',
    '260': 'Nagpur',
    // Add more district code mappings as needed
  };
  
  // Return the district name if found, otherwise return the code itself
  // (assuming it might be a direct district name)
  return districtMapping[districtCode] || districtCode;
}

/**
 * Get normalized location score (0-1 scale)
 * @param {string|number} userDistrict - User's district code or name
 * @param {string|number} matchDistrict - Match's district code or name
 * @returns {number} - Score between 0 and 1
 */
function getNormalizedLocationScore(userDistrict, matchDistrict) {
  // Get score on 0-5 scale
  const score = getLocationScore(userDistrict, matchDistrict);
  
  // Normalize to 0-1 scale
  return score / 5;
}

/**
 * Calculate location score based on location objects with district, state, country
 * @param {Object} userLocation - User's location object
 * @param {Object} matchLocation - Match's location object
 * @returns {number} - Score between 0 and 1
 */
function calculateLocationScore(userLocation, matchLocation) {
  // If location data is missing, return neutral score
  if (!userLocation || !matchLocation) return 0.5;
  
  // If coordinates are available and valid, use them for precise calculations
  if (userLocation.coordinates && matchLocation.coordinates && 
      userLocation.coordinates.length === 2 && matchLocation.coordinates.length === 2) {
    
    const [lon1, lat1] = userLocation.coordinates;
    const [lon2, lat2] = matchLocation.coordinates;
    
    // Calculate distance in kilometers using Haversine formula
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in kilometers
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Calculate score based on distance
    const score = calculateDistanceScore(distance);
    
    // Normalize to 0-1 scale
    return score / 5;
  }
  
  // If district codes are available, use them
  if (userLocation.district && matchLocation.district) {
    return getNormalizedLocationScore(userLocation.district, matchLocation.district);
  }
  
  // Fall back to location code comparison if coordinates and district-based calculation fails
  
  // Exact match on all location codes = perfect score
  if (userLocation.country === matchLocation.country && 
      userLocation.state === matchLocation.state && 
      userLocation.district === matchLocation.district) {
    return 1;
  }
  
  // Same country and state, different district
  if (userLocation.country === matchLocation.country && 
      userLocation.state === matchLocation.state) {
    return 0.8;
  }
  
  // Same country, different state
  if (userLocation.country === matchLocation.country) {
    return 0.4;
  }
  
  // Different country
  return 0.1;
}

module.exports = {
  calculateDistanceScore,
  getLocationScore,
  getNormalizedLocationScore,
  calculateLocationScore
};
