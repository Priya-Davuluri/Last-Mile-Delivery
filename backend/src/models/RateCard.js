const mongoose = require('mongoose');

const rateCardSchema = new mongoose.Schema(
  {
    orderType: {
      type: String,
      enum: {
        values: ['B2B', 'B2C'],
        message: '{VALUE} must be either B2B or B2C',
      },
      required: [true, 'Order type is required'],
    },
    rateType: {
      type: String,
      enum: {
        values: ['intra-zone', 'inter-zone'],
        message: '{VALUE} must be either intra-zone or inter-zone',
      },
      required: [true, 'Rate type is required'],
    },
    ratePerKg: {
      type: Number,
      required: [true, 'Rate per kg is required'],
      min: [0, 'Rate per kg cannot be negative'],
    },
    minCharge: {
      type: Number,
      default: 0,
      min: [0, 'Minimum charge cannot be negative'],
    },
    codSurcharge: {
      type: Number,
      default: 0,
      min: [0, 'COD surcharge cannot be negative'],
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

// Compound index to guarantee uniqueness of active rate configuration per combination
rateCardSchema.index({ orderType: 1, rateType: 1, isActive: 1 });

const RateCard = mongoose.model('RateCard', rateCardSchema);
module.exports = RateCard;
