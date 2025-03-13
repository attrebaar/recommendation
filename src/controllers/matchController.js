// src/controllers/matchController.js

const matchingService = require('../services/matchingService');

/**
 * Get ranked matches for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRankedMatches = async (req, res) => {
  try {
    const { matriid } = req.params;
    const { preferences, filters } = req.body;
    
    const rankedMatches = await matchingService.findAndRankMatches(
      matriid,
      preferences,
      filters
    );
    
    res.status(200).json({
      success: true,
      matches: rankedMatches
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Score a specific set of matches for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const scoreMatches = async (req, res) => {
  try {
    const { matriid } = req.params;
    const { matchesIds, preferences } = req.body;
    
    if (!matchesIds || !Array.isArray(matchesIds)) {
      return res.status(400).json({
        success: false,
        message: 'matchesIds must be an array of matriids'
      });
    }
    
    const scoredMatches = await matchingService.scoreGivenMatches(
      matriid,
      matchesIds,
      preferences
    );
    
    res.status(200).json({
      success: true,
      matches: scoredMatches
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get a user's profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserProfile = async (req, res) => {
  try {
    const { matriid } = req.params;
    
    const user = await matchingService.getUser(matriid);
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getRankedMatches,
  scoreMatches,
  getUserProfile
};