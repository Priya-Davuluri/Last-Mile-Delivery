const mongoose = require('mongoose');

const agentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for AgentProfile'],
      unique: true,
    },
    currentLocation: {
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
    },
    assignedZones: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone',
      },
    ],
    availabilityStatus: {
      type: String,
      enum: {
        values: ['available', 'unavailable', 'on-delivery'],
        message: '{VALUE} is not a valid availability status',
      },
      default: 'available',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes specified in README Section 9
agentProfileSchema.index({ assignedZones: 1 });
agentProfileSchema.index({ availabilityStatus: 1 });

const AgentProfile = mongoose.model('AgentProfile', agentProfileSchema);
module.exports = AgentProfile;
