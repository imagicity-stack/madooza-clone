require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');

const { buildNotes } = require('./utils/notes');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

const requiredEnv = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.warn(
    `⚠️  Missing required Razorpay configuration. Please set: ${missingEnv.join(', ')}`
  );
}

let razorpayInstance;

function getRazorpay() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  return razorpayInstance;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/orders/:formType', async (req, res, next) => {
  try {
    const { formType } = req.params;
    const { amount, currency = 'INR', formData = {}, receipt, metadata = {} } = req.body;

    if (!formType) {
      return res.status(400).json({ message: 'A form type must be provided in the URL.' });
    }

    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ message: 'An amount is required.' });
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    const orderOptions = {
      amount: Math.round(parsedAmount * 100),
      currency,
      receipt: receipt || `${formType}-${Date.now()}`,
      notes: buildNotes(formType, { ...formData, ...metadata }),
      payment_capture: 1,
    };

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create(orderOptions);

    return res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Failed to create Razorpay order', error);
    return next(error);
  }
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode || 500;
  const message =
    err.message || 'Unexpected error while creating the payment order. Please try again.';

  res.status(status).json({ message });
});

const port = process.env.PORT || 4000;

function start() {
  app.listen(port, () => {
    console.log(`Madooza backend listening on port ${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
