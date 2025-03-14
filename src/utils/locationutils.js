// src\utils\locationUtils.js

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
    return 4;    // Between 26 to 50 KM
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
 * Calculate location score based on location objects with district, state, country
 * @param {Object} userLocation - User's location object
 * @param {Object} matchLocation - Match's location object
 * @returns {number} - Score between 0 and 5
 */
function calculateLocationScore(userLocation, matchLocation) {
  // If location data is missing, return neutral score
  if (!userLocation || !matchLocation) return 3;
  
  // Calculate score based on district codes
  if (userLocation.district && matchLocation.district) {
    // Same district = perfect score
    if (userLocation.district === matchLocation.district) {
      return 5;
    }
    
    // For different districts, we would ideally calculate distance
    // Since we don't have the actual distances between districts in this implementation,
    // we'll use a fallback scoring based on administrative boundaries
    // This should be replaced with actual distance calculations in production
    
    // Same state, different district
    if (userLocation.state === matchLocation.state) {
      return 3; // Medium score for same state
    }
    
    // Same country, different state
    if (userLocation.country === matchLocation.country) {
      return 1; // Low score for same country, different state
    }
    
    // Different country
    return 0; // Lowest score for different country
  }
  
  // Fall back to location code comparison if district data is incomplete
  
  // Exact match on all location codes = perfect score
  if (userLocation.country === matchLocation.country && 
      userLocation.state === matchLocation.state && 
      userLocation.district === matchLocation.district) {
    return 5;
  }
  
  // Same country and state, different or missing district
  if (userLocation.country === matchLocation.country && 
      userLocation.state === matchLocation.state) {
    return 3;
  }
  
  // Same country, different state
  if (userLocation.country === matchLocation.country) {
    return 1;
  }
  
  // Different country or missing data
  return 0;
}

module.exports = {
  calculateDistanceScore,
  calculateLocationScore
};