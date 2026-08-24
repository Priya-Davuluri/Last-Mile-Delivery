const nodemailer = require('nodemailer');
const { Notification } = require('../models');

// Configure Nodemailer Transporter
let transporter = null;

const initTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass && pass !== 'your_app_specific_password') {
    transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user,
        pass,
      },
    });
    console.log(`✉️ Nodemailer SMTP transport initialized for host: ${host}`);
  } else {
    // Development / Console Fallback Transporter
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('\n=================== [EMAIL NOTIFICATION LOG] ===================');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`From: ${mailOptions.from || process.env.EMAIL_FROM || 'no-reply@lastmiledelivery.com'}`);
        console.log('--- Email HTML Body Preview ---');
        console.log(mailOptions.text || mailOptions.html.replace(/<[^>]*>?/gm, ' ').substring(0, 300) + '...');
        console.log('=================================================================\n');
        return { messageId: `mock-${Date.now()}@lastmile.local` };
      },
    };
    console.log('ℹ️ Nodemailer running in development log mode (configure SMTP in .env for live dispatch).');
  }
};

initTransporter();

// ==========================================
// HTML Email Templates
// ==========================================

const getClientBaseUrl = () => {
  return process.env.CLIENT_URL || 'http://localhost:5173';
};

/**
 * 1. Template: Order Placement Confirmation
 */
const getOrderConfirmationHtml = (order, customer) => {
  const trackingUrl = `${getClientBaseUrl()}/track/${order._id}`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F19; color: #F9FAFB; border-radius: 12px; overflow: hidden; border: 1px solid #1F2937;">
      <div style="background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Confirmed!</h1>
        <p style="color: #E0E7FF; margin: 8px 0 0;">Last-Mile Delivery Tracker</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #E5E7EB;">Hello <strong>${customer.name}</strong>,</p>
        <p style="color: #9CA3AF;">Your shipment has been registered and is being prepared for dispatch.</p>

        <div style="background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <div style="margin-bottom: 8px;"><span style="color: #9CA3AF;">Tracking ID:</span> <strong style="color: #60A5FA; font-family: monospace;">${order._id}</strong></div>
          <div style="margin-bottom: 8px;"><span style="color: #9CA3AF;">Pickup:</span> ${order.pickupAddress}</div>
          <div style="margin-bottom: 8px;"><span style="color: #9CA3AF;">Destination:</span> ${order.dropAddress}</div>
          <div style="margin-bottom: 8px;"><span style="color: #9CA3AF;">Billable Weight:</span> ${order.billableWeight} kg (${order.orderType})</div>
          <div style="margin-bottom: 8px;"><span style="color: #9CA3AF;">Total Amount:</span> <strong style="color: #10B981;">₹${order.totalCharge}</strong> (${order.paymentType})</div>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${trackingUrl}" style="background: #3B82F6; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">
            Track Your Delivery
          </a>
        </div>

        <p style="color: #6B7280; font-size: 12px; text-align: center; margin-top: 24px;">
          This is an automated notification. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  `;
};

/**
 * 2. Template: Status Milestone Update
 */
const getStatusUpdateHtml = (order, customer, status, notes) => {
  const trackingUrl = `${getClientBaseUrl()}/track/${order._id}`;
  const statusTitles = {
    assigned: 'Delivery Agent Assigned',
    'picked-up': 'Package Picked Up',
    'in-transit': 'Package In Transit',
    'out-for-delivery': 'Out for Delivery Today',
    delivered: 'Package Successfully Delivered!',
  };

  const title = statusTitles[status] || `Status Updated: ${status}`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F19; color: #F9FAFB; border-radius: 12px; overflow: hidden; border: 1px solid #1F2937;">
      <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">${title}</h1>
        <p style="color: #D1FAE5; margin: 8px 0 0;">Tracking ID: ${order._id}</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #E5E7EB;">Hello <strong>${customer.name}</strong>,</p>
        <p style="color: #9CA3AF;">Your shipment milestone has been updated to <strong>${status.toUpperCase()}</strong>.</p>

        ${notes ? `<div style="background: #111827; border-left: 4px solid #10B981; padding: 12px 16px; margin: 16px 0; color: #D1D5DB; font-size: 14px;">${notes}</div>` : ''}

        <div style="background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <div style="margin-bottom: 8px;"><span style="color: #9CA3AF;">Destination:</span> ${order.dropAddress}</div>
          <div style="margin-bottom: 8px;"><span style="color: #9CA3AF;">Payment:</span> ${order.paymentType} (₹${order.totalCharge})</div>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${trackingUrl}" style="background: #10B981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">
            View Real-Time Tracking
          </a>
        </div>
      </div>
    </div>
  `;
};

/**
 * 3. Template: Failed Delivery with Reschedule Link
 */
const getFailedDeliveryHtml = (order, customer, reason) => {
  const trackingUrl = `${getClientBaseUrl()}/track/${order._id}`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F19; color: #F9FAFB; border-radius: 12px; overflow: hidden; border: 1px solid #EF4444;">
      <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Delivery Attempt Unsuccessful</h1>
        <p style="color: #FEE2E2; margin: 8px 0 0;">Action Required to Reschedule</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #E5E7EB;">Hello <strong>${customer.name}</strong>,</p>
        <p style="color: #9CA3AF;">
          Our delivery agent attempted to deliver your shipment (<strong>#${order._id}</strong>), but was unable to complete the delivery.
        </p>

        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0;">
          <div style="color: #F87171; font-weight: bold; margin-bottom: 4px;">Reason Recorded:</div>
          <div style="color: #FEE2E2; font-size: 14px;">${reason || 'Customer unavailable at delivery address'}</div>
        </div>

        <p style="color: #E5E7EB;">
          Please select your preferred reschedule date so our team can arrange the next delivery attempt.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${trackingUrl}" style="background: #EF4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Reschedule Delivery Now
          </a>
        </div>
      </div>
    </div>
  `;
};

// ==========================================
// Central Dispatcher
// ==========================================

/**
 * Sends notification email and persists log to database
 */
const sendNotification = async ({ order, customer, type, status, reason, notes }) => {
  if (!customer || !customer.email) {
    console.warn(`Cannot send notification: Missing customer email for order ${order?._id}`);
    return;
  }

  let subject = `Shipment Update: #${order._id.toString().substring(order._id.toString().length - 6)}`;
  let html = '';

  if (type === 'order-created') {
    subject = `Order Confirmation #${order._id.toString().substring(order._id.toString().length - 6)} — Last-Mile Delivery`;
    html = getOrderConfirmationHtml(order, customer);
  } else if (type === 'failed-delivery' || status === 'failed') {
    subject = `Action Required: Delivery Attempt Failed for Order #${order._id.toString().substring(order._id.toString().length - 6)}`;
    html = getFailedDeliveryHtml(order, customer, reason || notes);
  } else {
    subject = `Delivery Milestone: ${status?.toUpperCase()} — Order #${order._id.toString().substring(order._id.toString().length - 6)}`;
    html = getStatusUpdateHtml(order, customer, status, notes);
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || '"Last-Mile Delivery" <no-reply@lastmiledelivery.com>';
    await transporter.sendMail({
      from: fromAddress,
      to: customer.email,
      subject,
      html,
    });

    // Record Notification document
    await Notification.create({
      order: order._id,
      customer: customer._id,
      type: type || 'status-update',
      channel: 'email',
      sentAt: new Date(),
    });
  } catch (error) {
    console.error(`Failed to send email notification to ${customer.email}:`, error.message);
  }
};

module.exports = {
  sendNotification,
};
