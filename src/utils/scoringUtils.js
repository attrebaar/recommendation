// src/utils/scoringUtils.js

// Import the location utilities
const { calculateLocationScore: calculateDistrictLocationScore } = require('./locationUtils');

/**
 * Map education array value to category
 * @param {number} educationValue - Education code
 * @returns {string} - Category: 'Grad and above' or 'Less than diploma'
 */
const mapEducationToCategory = (educationValue) => {
  // Based on the mapping provided
  const gradAndAbove = [1, 2]; // Master's Degree, Bachelor's Degree
  
  if (gradAndAbove.includes(educationValue)) {
    return 'Grad and above';
  } else {
    return 'Less than diploma';
  }
};

/**
 * Map occupation array value to category
 * @param {number} occupationValue - Occupation code
 * @returns {string} - Category: 'Stable Job' or 'Unstable job'
 */
const mapOccupationToCategory = (occupationValue) => {
  // Based on the mapping provided
  const stableJobs = [1, 2, 4]; // Private Company, Government Job, Own Business
  
  if (stableJobs.includes(occupationValue)) {
    return 'Stable Job';
  } else {
    return 'Unstable job';
  }
};

/**
 * Calculate age score based on user's age and match's age
 * @param {number} userAge - Age of the user
 * @param {number} matchAge - Age of the potential match
 * @param {string} userGender - Gender of the user
 * @param {string} matchGender - Gender of the potential match
 * @returns {number} - Score between 0 and 5
 */
const calculateAgeScore = (userAge, matchAge, userGender, matchGender) => {
  // Default score if gender information is missing
  if (!userGender || !matchGender) return 3; // Default moderate score
  
  // Apply the male-female age difference logic
  if (userGender === 'male' && matchGender === 'female') {
    const ageDifference = userAge - matchAge;
    
    // Apply the scoring logic based on the table provided
    if (ageDifference < -2) {
      return 0; // Score: 0
    } else if (ageDifference >= -2 && ageDifference < 0) {
      return 2; // Score: 2
    } else if (ageDifference === 0) {
      return 4; // Score: 4
    } else if (ageDifference >= 1 && ageDifference <= 5) {
      return 5; // Score: 5
    } else if (ageDifference > 5 && ageDifference <= 8) {
      return 4; // Score: 4
    } else if (ageDifference > 8 && ageDifference <= 12) {
      return 3; // Score: 3
    } else if (ageDifference > 12) {
      return 1; // Score: 1
    }
  } 
  // For other gender combinations, we might want to define different rules
  else {
    // Exact match gets high score
    if (userAge === matchAge) return 4;
    
    // Reasonable age difference (within 5 years) gets moderate score
    const ageDifference = Math.abs(userAge - matchAge);
    if (ageDifference <= 5) {
      return 3;
    }
    
    // Larger differences get lower scores
    return Math.max(0, 2 - Math.floor(ageDifference / 5));
  }
};

/**
 * Calculate income score based on user's income and match's income
 * Updated rules:
 * - If male income >= Female income: score 5
 * - If male income < Female income: score 0
 * - If male income = 0 AND female income = ANY: score 0
 * - If female income = 0 AND male income = ANY: score 5
 * 
 * @param {number} userIncome - Income of the user
 * @param {number} matchIncome - Income of the potential match
 * @param {string} userGender - Gender of the user
 * @param {string} matchGender - Gender of the match
 * @returns {number} - Score between 0 and 5
 */
const calculateIncomeScore = (userIncome, matchIncome, userGender, matchGender) => {
  // Special cases for missing income data
  if (userGender === 'male') {
    // Male user
    if (userIncome === 0) {
      // Male user has no income data
      return 0;
    } else if (matchIncome === 0) {
      // Female match has no income data
      return 5;
    } else {
      // Both have income data
      return userIncome >= matchIncome ? 5 : 0;
    }
  } else if (userGender === 'female') {
    // Female user
    if (userIncome === 0) {
      // Female user has no income data
      return 5;
    } else if (matchIncome === 0) {
      // Male match has no income data
      return 0;
    } else {
      // Both have income data
      return matchIncome >= userIncome ? 5 : 0;
    }
  } else {
    // For other gender combinations, return a neutral score
    return 3;
  }
};

/**
 * Calculate education score based on gender and education category
 * @param {string} userGender - User's gender
 * @param {number} userEducation - User's education code
 * @param {string} matchGender - Match's gender
 * @param {number} matchEducation - Match's education code
 * @returns {number} - Score between 1 and 5
 */
const calculateEducationScore = (userGender, userEducation, matchGender, matchEducation) => {
  // If education info is missing, return neutral score
  if (!userEducation || !matchEducation) return 3;
  
  const userCategory = mapEducationToCategory(userEducation);
  const matchCategory = mapEducationToCategory(matchEducation);
  
  // Apply the scoring logic based on the table provided
  let score = 3; // Default score
  
  if (userGender === 'male') {
    if (userCategory === 'Less than diploma' && matchCategory === 'Less than diploma') {
      score = 5;
    } else if (userCategory === 'Less than diploma' && matchCategory === 'Grad and above') {
      score = 1;
    } else if (userCategory === 'Grad and above' && matchCategory === 'Less than diploma') {
      score = 4;
    } else if (userCategory === 'Grad and above' && matchCategory === 'Grad and above') {
      score = 5;
    }
  } else if (userGender === 'female') {
    if (userCategory === 'Less than diploma' && matchCategory === 'Less than diploma') {
      score = 5;
    } else if (userCategory === 'Less than diploma' && matchCategory === 'Grad and above') {
      score = 3;
    } else {
      // For other combinations not specifically mentioned, use a neutral score
      score = 3;
    }
  }
  
  return score;
};

/**
 * Calculate occupation score based on gender and occupation category
 * @param {string} userGender - User's gender
 * @param {number} userOccupation - User's occupation code
 * @param {string} matchGender - Match's gender
 * @param {number} matchOccupation - Match's occupation code
 * @returns {number} - Score between 1 and 5
 */
const calculateOccupationScore = (userGender, userOccupation, matchGender, matchOccupation) => {
  // If occupation info is missing, return neutral score
  if (userOccupation == null || matchOccupation == null) return 3;
  
  const userCategory = mapOccupationToCategory(userOccupation);
  const matchCategory = mapOccupationToCategory(matchOccupation);
  
  // Apply the scoring logic based on the table provided
  let score = 3; // Default score
  
  if (userGender === 'male') {
    if (userCategory === 'Stable Job') {
      // "User = Male & stable job, Match = Female & any job" = 5
      score = 5;
    } else if (userCategory === 'Unstable job' && matchCategory === 'Unstable job') {
      // "User = Male & unstable job, Match = Female & unstable job" = 5
      score = 5;
    } else if (userCategory === 'Unstable job' && matchCategory === 'Stable Job') {
      // "User = Male & unstable job, Match = Female & stable job" = 2
      score = 2;
    }
  } else if (userGender === 'female') {
    if (userCategory === 'Unstable job' && matchCategory === 'Stable Job') {
      // "User = Female & unstable job, Match = Male & stable job" = 4
      score = 4;
    } else if (userCategory === 'Unstable job' && matchCategory === 'Unstable job') {
      // "User = Female & unstable job, Match = Male & unstable job" = 5
      score = 5;
    } else if (userCategory === 'Stable Job' && matchCategory === 'Unstable job') {
      // "User = Female & stable job, Match = Male & unstable job" = 1
      score = 1;
    } else if (userCategory === 'Stable Job' && matchCategory === 'Stable Job') {
      // "User = Female & stable job, Match = Male & stable job" = 5
      score = 5;
    }
  }
  
  return score;
};

/**
 * Calculate location score based on location objects with district, state, country
 * @param {Object} userLocation - User's location object
 * @param {Object} matchLocation - Match's location object
 * @returns {number} - Score between 0 and 5
 */
const calculateLocationScore = (userLocation, matchLocation) => {
  // Use the updated location score from locationUtils that returns 0-5 score
  return calculateDistrictLocationScore(userLocation, matchLocation);
};

/**
 * Calculate profile completeness score based on requirements:
 * - Less than 50%: 0
 * - Between 51% and 80%: 3
 * - Between 81% and 95%: 4.5
 * - Equal to 100%: 5
 * 
 * @param {Object} user - User object with all profile fields
 * @returns {number} - Score between 0 and 5
 */
const calculateProfileCompletenessScore = (user) => {
  // Get profile completeness percentage (0-1 scale)
  let completenessPercentage = 0;
  
  // Use the precomputed profileCompleteness value if available
  if (user.profileCompleteness != null) {
    completenessPercentage = user.profileCompleteness;
  } else {
    // Fallback - calculate based on fields
    const essentialFields = [
      'age', 'income', 'occupation', 'education', 
      'location', 'photoAvailable'
    ];
    
    // Count how many fields are completed
    const completedFields = essentialFields.filter(field => {
      if (!user[field] && user[field] !== 0 && user[field] !== false) return false;
      
      // Objects should have required properties
      if (field === 'location' && typeof user[field] === 'object') {
        return (user[field].country || user[field].state || user[field].district) || 
               (user[field].coordinates && user[field].coordinates.length === 2);
      }
      
      return true;
    });
    
    completenessPercentage = completedFields.length / essentialFields.length;
  }
  
  // Convert to percentage (0-100 scale)
  const percentage = completenessPercentage * 100;
  
  // Apply scoring logic
  if (percentage < 50) {
    return 0;
  } else if (percentage >= 50 && percentage <= 80) {
    return 3;
  } else if (percentage > 80 && percentage <=95) {
    return 4.5;
  } else if (percentage > 95) {
    return 5;
  }
  
  // Default case (shouldn't happen but just in case)
  return 0;
};

/**
 * Calculate last login score based on requirements:
 * - Less than 24 hrs: 5
 * - Between 24 hrs and 3 days: 4
 * - Between 4 days and 7 days: 3
 * - Between 8 days and 30 days: 2
 * - Between 31 days and 90 days: 1
 * - >90 days: 0
 * 
 * @param {Date} lastLogin - Date of last login
 * @returns {number} - Score between 0 and 5
 */
const calculateLastLoginScore = (lastLogin) => {
  if (!lastLogin) return 0;
  
  const now = new Date();
  const hoursSinceLastLogin = (now - new Date(lastLogin)) / (1000 * 60 * 60);
  const daysSinceLastLogin = hoursSinceLastLogin / 24;
  
  // Less than 24 hours
  if (hoursSinceLastLogin < 24) {
    return 5;
  }
  
  // Between 24 hours and 3 days
  if (daysSinceLastLogin >= 1 && daysSinceLastLogin <= 3) {
    return 4;
  }
  
  // Between 4 days and 7 days
  if (daysSinceLastLogin >= 4 && daysSinceLastLogin <= 7) {
    return 3;
  }
  
  // Between 8 days and 30 days
  if (daysSinceLastLogin >= 8 && daysSinceLastLogin <= 30) {
    return 2;
  }
  
  // Between 31 days and 90 days
  if (daysSinceLastLogin >= 31 && daysSinceLastLogin <= 90) {
    return 1;
  }
  
  // More than 90 days
  return 0;
};

/**
 * Calculate freshness score (newer profiles = higher score):
 * - Less than 24 hrs: 5
 * - Between 24 hrs and 3 days: 4
 * - Between 3 days and 7 days: 3
 * - Between 7 days and 30 days: 2
 * - >30 days: 0
 * 
 * @param {Date} createdAt - Date when the profile was created
 * @returns {number} - Score between 0 and 5
 */
const calculateFreshnessScore = (createdAt) => {
  if (!createdAt) return 0;
  
  const now = new Date();
  const hoursSinceCreation = (now - new Date(createdAt)) / (1000 * 60 * 60);
  const daysSinceCreation = hoursSinceCreation / 24;
  
  // Profile created within last 24 hours
  if (hoursSinceCreation < 24) {
    return 5;
  }
  
  // Profile created between 24 hours and 3 days
  if (daysSinceCreation >= 1 && daysSinceCreation < 3) {
    return 4;
  }
  
  // Profile created between 3 days and 7 days
  if (daysSinceCreation >= 3 && daysSinceCreation < 7) {
    return 3;
  }
  
  // Profile created between 7 days and 30 days
  if (daysSinceCreation >= 7 && daysSinceCreation < 30) {
    return 2;
  }
  
  // Profile created more than 30 days ago
  return 0;
};

/**
 * Calculate photo availability score
 * @param {Boolean} photoAvailable - Whether user has photos
 * @returns {number} - Score between 0 and 5
 */
const calculatePhotoAvailabilityScore = (photoAvailable) => {
  // Simple boolean check - 5 if photo is available, 0 if not
  return photoAvailable ? 5 : 0;
};

module.exports = {
  calculateAgeScore,
  calculateIncomeScore,
  calculateOccupationScore,
  calculateEducationScore,
  calculateLocationScore,
  calculateProfileCompletenessScore,
  calculateLastLoginScore,
  calculateFreshnessScore,
  calculatePhotoAvailabilityScore
};