const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    createdByAdmin: {
      type: Boolean,
      default: false,
    },
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
    },
    pickupZone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Pickup zone must be resolved'],
      index: true,
    },
    dropAddress: {
      type: String,
      required: [true, 'Drop address is required'],
      trim: true,
    },
    dropZone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Drop zone must be resolved'],
      index: true,
    },
    dimensions: {
      length: {
        type: Number,
        required: [true, 'Package length in cm is required'],
        min: [0.1, 'Length must be greater than 0'],
      },
      breadth: {
        type: Number,
        required: [true, 'Package breadth in cm is required'],
        min: [0.1, 'Breadth must be greater than 0'],
      },
      height: {
        type: Number,
        required: [true, 'Package height in cm is required'],
        min: [0.1, 'Height must be greater than 0'],
      },
    },
    actualWeight: {
      type: Number,
      required: [true, 'Actual weight in kg is required'],
      min: [0.01, 'Weight must be greater than 0'],
    },
    volumetricWeight: {
      type: Number,
      required: [true, 'Volumetric weight is required'],
      min: [0, 'Volumetric weight cannot be negative'],
    },
    billableWeight: {
      type: Number,
      required: [true, 'Billable weight is required'],
      min: [0.01, 'Billable weight must be greater than 0'],
    },
    orderType: {
      type: String,
      enum: {
        values: ['B2B', 'B2C'],
        message: '{VALUE} must be either B2B or B2C',
      },
      required: [true, 'Order type is required'],
    },
    paymentType: {
      type: String,
      enum: {
        values: ['Prepaid', 'COD'],
        message: '{VALUE} must be either Prepaid or COD',
      },
      required: [true, 'Payment type is required'],
    },
    rateApplied: {
      type: Number,
      required: [true, 'Snapshot rateApplied is required'],
    },
    codSurchargeApplied: {
      type: Number,
      default: 0,
    },
    totalCharge: {
      type: Number,
      required: [true, 'Snapshot totalCharge is required'],
      min: [0, 'Total charge cannot be negative'],
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AgentProfile',
      default: null,
      index: true,
    },
    assignmentType: {
      type: String,
      enum: {
        values: ['manual', 'auto'],
        message: '{VALUE} must be either manual or auto',
      },
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'assigned',
          'picked-up',
          'in-transit',
          'out-for-delivery',
          'delivered',
          'failed',
        ],
        message: '{VALUE} is not a valid order status',
      },
      default: 'pending',
      index: true,
    },
    rescheduledDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for quick status and customer lookups
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
