const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      trim: true,
      unique: true,
    },
    areasCovered: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index on areasCovered for rapid pincode / area lookup
zoneSchema.index({ areasCovered: 1 });

const Zone = mongoose.model('Zone', zoneSchema);
module.exports = Zone;
