// src\models\User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  matriid: {
    type: String,
    required: true,
    unique: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  age: {
    type: Number
  },
  income: {
    type: Number,
    default: 0
  },
  occupation: {
    type: Number,
    // All occupation values from the dataset
    // 0 = Undefined, 1 = Private Company, 2 = Government Job, 3 = Self Employed, 
    // 4 = Own Business, 5 = Works in Shop, 6 = Works in Factory, 7 = Construction Worker,
    // 8 = Not Working, 10 = Agriculture
    min: 0,
    max: 10
  },
  education: {
    type: Number,
    // All education values from the dataset
    // 1 = Master's Degree, 2 = Bachelor's Degree, 3-17 = Various diploma levels and below
    min: 1,
    max: 17
  },
  // Location using coded values
  location: {
    country: {
      type: Number, // Coded value for country
      default: 98
    },
    state: {
      type: Number, // Coded value for state
      default: 18
    },
    district: {
      type: Number, // Coded value for district
      default: 0
    },
    // Optional coordinates for distance calculations
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: []
    }
  },
  // Photo availability flag
  photoAvailable: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  profileCompleteness: {
    type: Number,
    default: 0, // Value between 0 and 1
    min: 0,
    max: 1
  }
});

// Create indexes for efficient querying
UserSchema.index({ gender: 1 });
UserSchema.index({ "location.country": 1 });
UserSchema.index({ "location.state": 1 });
UserSchema.index({ "location.district": 1 });

// If coordinates are available, create a geospatial index
UserSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model('User', UserSchema);