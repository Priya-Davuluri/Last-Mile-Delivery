const mongoose = require('mongoose');

const trackingHistorySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required for tracking history'],
      index: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      trim: true,
    },
    actor: {
      type: String,
      required: [true, 'Actor is required (e.g. agent:<id>, admin:<id>, system)'],
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true, // Mongoose schema level immutability
    },
  },
  {
    timestamps: false, // We use explicit immutable timestamp field
  }
);

// Index on order + timestamp for sorted chronological retrieval
trackingHistorySchema.index({ order: 1, timestamp: 1 });

// Guard against update/delete operations to maintain strict immutability
trackingHistorySchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'findByIdAndUpdate'], function (next) {
  const err = new Error('TrackingHistory records are immutable and cannot be updated.');
  next(err);
});

trackingHistorySchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete', 'findByIdAndDelete'], function (next) {
  const err = new Error('TrackingHistory records are immutable and cannot be deleted.');
  next(err);
});

const TrackingHistory = mongoose.model('TrackingHistory', trackingHistorySchema);
module.exports = TrackingHistory;
