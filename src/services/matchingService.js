// src/services/matchingService.js

const User = require('../models/User');
const { 
  calculateRankingScore, 
  calculateMatchingScore,
  calculateProfileCompletenessScore,
  calculateLastLoginScore,
  calculateFreshnessScore,
  calculatePhotoAvailabilityScore,
  calculateAgeScore,
  calculateIncomeScore,
  calculateOccupationScore,
  calculateEducationScore,
  calculateLocationScore
} = require('../utils/scoringUtils');

/**
 * Get user by matriid
 * @param {string} matriid - User's matrimony ID
 * @returns {Promise<Object>} - User object
 */
const getUser = async (matriid) => {
  try {
    const user = await User.findOne({ matriid });
    if (!user) {
      throw new Error(`User with matriid ${matriid} not found`);
    }
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Find potential matches for a user
 * @param {Object} user - User object
 * @param {Object} filters - Additional filters to apply
 * @returns {Promise<Array>} - Array of potential matches
 */
const findPotentialMatches = async (user, filters = {}) => {
  try {
    // Determine opposite gender for matching
    const lookingFor = user.gender === 'male' ? 'female' : 'male';
    
    // Build query for finding potential matches
    const query = {
      matriid: { $ne: user.matriid }, // Exclude the user
      gender: lookingFor,
    };
    
    // Apply additional filters if provided
    if (filters.minAge) query.age = { ...query.age, $gte: filters.minAge };
    if (filters.maxAge) query.age = { ...query.age, $lte: filters.maxAge };
    
    // Add location filters
    if (user.location) {
      // If coordinates are available, use geospatial query
      if (user.location.coordinates && user.location.coordinates.length === 2 && filters.maxDistance) {
        query['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: user.location.coordinates
            },
            $maxDistance: filters.maxDistance * 1000 // Convert km to meters
          }
        };
      } else {
        // Otherwise filter by location codes
        if (filters.sameCountry) {
          query['location.country'] = user.location.country;
        }
        if (filters.sameState) {
          query['location.state'] = user.location.state;
        }
        if (filters.sameDistrict) {
          query['location.district'] = user.location.district;
        }
      }
    }
    
    // Execute query to find potential matches
    const potentialMatches = await User.find(query).limit(100);
    return potentialMatches;
  } catch (error) {
    throw error;
  }
};

/**
 * Score and rank matches for a user with detailed component scores
 * @param {Object} user - User object
 * @param {Array} matches - Array of potential matches
 * @param {Object} preferences - User's preferences
 * @returns {Array} - Ranked matches with detailed scores
 */
const rankMatchesWithDetails = (user, matches, preferences = {}) => {
  // Define component weights
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
  
  // Calculate ranking score for each match with component breakdowns
  const rankedMatches = matches.map(match => {
    // Calculate main component scores
    const ageScore = calculateAgeScore(user.age, match.age, preferences);
    const incomeScore = calculateIncomeScore(user.income, match.income, preferences);
    const occupationScore = calculateOccupationScore(user.gender, user.occupation, match.gender, match.occupation);
    const educationScore = calculateEducationScore(user.gender, user.education, match.gender, match.education);
    const locationScore = calculateLocationScore(user.location, match.location, preferences);
    
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
      matriid: match.matriid,
      age: match.age,
      education: match.education,
      occupation: match.occupation,
      location: {
        district: match.location.district,
        state: match.location.state,
        country: match.location.country
      },
      photoAvailable: match.photoAvailable,
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
  });
  
  // Sort by score in descending order
  return rankedMatches.sort((a, b) => b.finalScore - a.finalScore);
};

/**
 * Find and rank matches for a user
 * @param {string} matriid - User's matrimony ID
 * @param {Object} preferences - User's preferences
 * @param {Object} filters - Additional filters to apply
 * @returns {Promise<Array>} - Ranked matches with scores
 */
const findAndRankMatches = async (matriid, preferences = {}, filters = {}) => {
  try {
    // Get user by matriid
    const user = await getUser(matriid);
    
    // Find potential matches
    const potentialMatches = await findPotentialMatches(user, filters);
    
    // Rank matches with detailed component scores
    const rankedMatches = rankMatchesWithDetails(user, potentialMatches, preferences);
    
    return rankedMatches;
  } catch (error) {
    throw error;
  }
};

/**
 * Score a given set of matches
 * @param {string} matriid - User's matrimony ID
 * @param {Array} matchesIds - Array of potential match IDs to score
 * @param {Object} preferences - User's preferences
 * @returns {Promise<Array>} - Ranked matches with scores
 */
const scoreGivenMatches = async (matriid, matchesIds, preferences = {}) => {
  try {
    // Get user by matriid
    const user = await getUser(matriid);
    
    // Get matches by their IDs
    const matches = await User.find({ matriid: { $in: matchesIds } });
    
    // Rank matches with detailed component scores
    const rankedMatches = rankMatchesWithDetails(user, matches, preferences);
    
    return rankedMatches;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  findAndRankMatches,
  scoreGivenMatches,
  getUser
};