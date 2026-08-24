const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required (e.g. status-update, failed-delivery)'],
      trim: true,
    },
    channel: {
      type: String,
      enum: {
        values: ['email', 'sms'],
        message: '{VALUE} is not a valid channel',
      },
      default: 'email',
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for query by customer or order
notificationSchema.index({ customer: 1, sentAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
