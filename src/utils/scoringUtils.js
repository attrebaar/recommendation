// src\utils\scoringUtils.js

// Import the location utilities
const { calculateLocationScore } = require('./locationUtils');

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
 * @returns {number} - Score between 0 and 1
 */
const calculateAgeScore = (userAge, matchAge) => {
  // Default age preference: within 5 years of user's age
  const preferredMinAge = Math.max(18, userAge - 5);
  const preferredMaxAge = userAge + 5;
  
  // Exact match gets perfect score
  if (matchAge === userAge) return 1;
  
  // Within preferred range gets good score
  if (matchAge >= preferredMinAge && matchAge <= preferredMaxAge) {
    // Calculate how close the match is to user's age within the range
    const rangeSize = preferredMaxAge - preferredMinAge;
    const distanceFromUser = Math.abs(userAge - matchAge);
    return 1 - (distanceFromUser / (rangeSize + 1));
  }
  
  // Outside preferred range gets lower score based on how far outside
  const distanceOutsideRange = matchAge < preferredMinAge 
    ? preferredMinAge - matchAge 
    : matchAge - preferredMaxAge;
  
  return Math.max(0, 1 - (distanceOutsideRange / 10));
};

/**
 * Calculate income score based on user's income and match's income
 * @param {number} userIncome - Income of the user
 * @param {number} matchIncome - Income of the potential match
 * @returns {number} - Score between 0 and 1
 */
const calculateIncomeScore = (userIncome, matchIncome) => {
  // If no income data is available, return neutral score
  if (userIncome === 0 && matchIncome === 0) return 0.5;
  
  // If one is 0, assume it's not provided
  if (userIncome === 0 || matchIncome === 0) return 0.5;
  
  // Higher income gets better score, with diminishing returns
  if (matchIncome >= userIncome) {
    // Cap the benefit at 2x user's income
    const ratio = Math.min(matchIncome / userIncome, 2);
    return 0.7 + (0.3 * (ratio - 1));
  } else {
    // Lower income gets lower score, but not too harshly
    const ratio = matchIncome / userIncome;
    return 0.7 * ratio;
  }
};

/**
 * Calculate education score based on gender and education category
 * @param {string} userGender - User's gender
 * @param {number} userEducation - User's education code
 * @param {string} matchGender - Match's gender
 * @param {number} matchEducation - Match's education code
 * @returns {number} - Score between 0 and 1 (normalized from 1-5 scale)
 */
const calculateEducationScore = (userGender, userEducation, matchGender, matchEducation) => {
  // If education info is missing, return neutral score
  if (!userEducation || !matchEducation) return 0.5;
  
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
  
  // Normalize score from 1-5 scale to 0-1 scale
  return score / 5;
};

/**
 * Calculate occupation score based on gender and occupation category
 * @param {string} userGender - User's gender
 * @param {number} userOccupation - User's occupation code
 * @param {string} matchGender - Match's gender
 * @param {number} matchOccupation - Match's occupation code
 * @returns {number} - Score between 0 and 1 (normalized from 1-5 scale)
 */
const calculateOccupationScore = (userGender, userOccupation, matchGender, matchOccupation) => {
  // If occupation info is missing, return neutral score
  if (userOccupation == null || matchOccupation == null) return 0.5;
  
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
  
  // Normalize score from 1-5 scale to 0-1 scale
  return score / 5;
};

/**
 * Calculate profile completeness score
 * @param {Object} user - User object with all profile fields
 * @returns {number} - Score between 0 and 1
 */
const calculateProfileCompletenessScore = (user) => {
  // For this implementation, we'll just use the precomputed profileCompleteness value
  // This is because it's already provided in the dataset
  if (user.profileCompleteness != null) {
    return user.profileCompleteness;
  }
  
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
  
  return completedFields.length / essentialFields.length;
};

/**
 * Calculate last login score (more recent = higher score)
 * @param {Date} lastLogin - Date of last login
 * @returns {number} - Score between 0 and 1
 */
const calculateLastLoginScore = (lastLogin) => {
  if (!lastLogin) return 0;
  
  const now = new Date();
  const daysSinceLastLogin = (now - new Date(lastLogin)) / (1000 * 60 * 60 * 24);
  
  // If logged in today
  if (daysSinceLastLogin < 1) return 1;
  
  // If logged in within the last week
  if (daysSinceLastLogin < 7) return 0.8;
  
  // If logged in within the last month
  if (daysSinceLastLogin < 30) return 0.6;
  
  // If logged in within the last 3 months
  if (daysSinceLastLogin < 90) return 0.4;
  
  // If logged in within the last year
  if (daysSinceLastLogin < 365) return 0.2;
  
  // If not logged in for over a year
  return 0;
};

/**
 * Calculate freshness score (newer profiles = higher score)
 * @param {Date} createdAt - Date when the profile was created
 * @returns {number} - Score between 0 and 1
 */
const calculateFreshnessScore = (createdAt) => {
  if (!createdAt) return 0.5;
  
  const now = new Date();
  const daysSinceCreation = (now - new Date(createdAt)) / (1000 * 60 * 60 * 24);
  
  // Profile created within last 7 days
  if (daysSinceCreation < 7) return 1;
  
  // Profile created within last month
  if (daysSinceCreation < 30) return 0.8;
  
  // Profile created within last 3 months
  if (daysSinceCreation < 90) return 0.6;
  
  // Profile created within last 6 months
  if (daysSinceCreation < 180) return 0.4;
  
  // Profile created within last year
  if (daysSinceCreation < 365) return 0.2;
  
  // Profile older than a year
  return 0.1;
};

/**
 * Calculate photo availability score
 * @param {Boolean} photoAvailable - Whether user has photos
 * @returns {number} - Score between 0 and 1
 */
const calculatePhotoAvailabilityScore = (photoAvailable) => {
  // Simple boolean check - 1 if photo is available, 0 if not
  return photoAvailable ? 1 : 0;
};

/**
 * Calculate matching score based on multiple factors
 * @param {Object} user - User object
 * @param {Object} match - Potential match object
 * @returns {number} - Score between 0 and 1
 */
const calculateMatchingScore = (user, match) => {
  // Weights from the document
  const weights = {
    age: 0.20,      // A1 = 20%
    income: 0.15,   // A2 = 15%
    occupation: 0.15, // A3 = 15%
    education: 0.20, // A4 = 20%
    location: 0.30   // A5 = 30%
  };
  
  // Calculate individual scores
  const ageScore = calculateAgeScore(user.age, match.age);
  const incomeScore = calculateIncomeScore(user.income, match.income);
  
  // For occupation and education, use the scoring functions with gender
  const occupationScore = calculateOccupationScore(
    user.gender, 
    user.occupation, 
    match.gender, 
    match.occupation
  );
  
  const educationScore = calculateEducationScore(
    user.gender, 
    user.education, 
    match.gender, 
    match.education
  );
  
  // Use the new location score calculation
  const locationScore = calculateLocationScore(user.location, match.location);
  
  // Calculate weighted average
  return (
    ageScore * weights.age +
    incomeScore * weights.income +
    occupationScore * weights.occupation +
    educationScore * weights.education +
    locationScore * weights.location
  );
};

/**
 * Calculate overall ranking score
 * @param {Object} user - User object
 * @param {Object} match - Potential match object
 * @returns {number} - Final ranking score between 0 and 5
 */
const calculateRankingScore = (user, match) => {
  // Weights from the document
  const weights = {
    matchingScore: 0.50,           // B1 = 50%
    profileCompleteness: 0.10,     // B2 = 10%
    lastLogin: 0.15,               // B3 = 15%
    freshness: 0.10,               // B4 = 10%
    photoAvailability: 0.15        // B5 = 15%
  };
  
  // Calculate component scores
  const matchingScore = calculateMatchingScore(user, match);
  const profileCompletenessScore = calculateProfileCompletenessScore(match);
  const lastLoginScore = calculateLastLoginScore(match.lastLogin);
  const freshnessScore = calculateFreshnessScore(match.createdAt);
  const photoAvailabilityScore = calculatePhotoAvailabilityScore(match.photoAvailable);
  
  // Calculate weighted average (between 0 and 1)
  const normalizedScore = (
    matchingScore * weights.matchingScore +
    profileCompletenessScore * weights.profileCompleteness +
    lastLoginScore * weights.lastLogin +
    freshnessScore * weights.freshness +
    photoAvailabilityScore * weights.photoAvailability
  );
  
  // Return score between 0 and 5
  return normalizedScore * 5;
};

// Function to get detailed component scores (for debugging and explanation)
const getDetailedScores = (user, match) => {
  // Component weights
  const componentWeights = {
    matchingScore: 0.50,           // B1 = 50%
    profileCompleteness: 0.10,     // B2 = 10%
    lastLogin: 0.15,               // B3 = 15%
    freshness: 0.10,               // B4 = 10%
    photoAvailability: 0.15        // B5 = 15%
  };
  
  const matchingWeights = {
    age: 0.20,      // A1 = 20%
    income: 0.15,   // A2 = 15%
    occupation: 0.15, // A3 = 15%
    education: 0.20, // A4 = 20%
    location: 0.30   // A5 = 30%
  };
  
  // Calculate individual scores
  const ageScore = calculateAgeScore(user.age, match.age);
  const incomeScore = calculateIncomeScore(user.income, match.income);
  const occupationScore = calculateOccupationScore(user.gender, user.occupation, match.gender, match.occupation);
  const educationScore = calculateEducationScore(user.gender, user.education, match.gender, match.education);
  const locationScore = calculateLocationScore(user.location, match.location);
  
  // Calculate matching score from components
  const matchingScore = (
    ageScore * matchingWeights.age +
    incomeScore * matchingWeights.income +
    occupationScore * matchingWeights.occupation +
    educationScore * matchingWeights.education +
    locationScore * matchingWeights.location
  );
  
  // Calculate other main component scores
  const profileCompletenessScore = calculateProfileCompletenessScore(match);
  const lastLoginScore = calculateLastLoginScore(match.lastLogin);
  const freshnessScore = calculateFreshnessScore(match.createdAt);
  const photoAvailabilityScore = calculatePhotoAvailabilityScore(match.photoAvailable);
  
  // Calculate final ranking score
  const finalScore = (
    matchingScore * componentWeights.matchingScore +
    profileCompletenessScore * componentWeights.profileCompleteness +
    lastLoginScore * componentWeights.lastLogin +
    freshnessScore * componentWeights.freshness +
    photoAvailabilityScore * componentWeights.photoAvailability
  );
  
  // Return detailed breakdown
  return {
    finalScore: finalScore * 5, // Convert to 0-5 scale
    componentScores: {
      matching: {
        score: matchingScore,
        weight: componentWeights.matchingScore,
        components: {
          age: {
            score: ageScore,
            weight: matchingWeights.age
          },
          income: {
            score: incomeScore,
            weight: matchingWeights.income
          },
          occupation: {
            score: occupationScore,
            weight: matchingWeights.occupation
          },
          education: {
            score: educationScore,
            weight: matchingWeights.education
          },
          location: {
            score: locationScore,
            weight: matchingWeights.location
          }
        }
      },
      profileCompleteness: {
        score: profileCompletenessScore,
        weight: componentWeights.profileCompleteness
      },
      lastLogin: {
        score: lastLoginScore,
        weight: componentWeights.lastLogin
      },
      freshness: {
        score: freshnessScore,
        weight: componentWeights.freshness
      },
      photoAvailability: {
        score: photoAvailabilityScore,
        weight: componentWeights.photoAvailability
      }
    }
  };
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
  calculatePhotoAvailabilityScore,
  calculateMatchingScore,
  calculateRankingScore,
  getDetailedScores
};