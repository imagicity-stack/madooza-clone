# Madooza Backend

This Express server exposes a single endpoint that the frontend booking forms (cosplay, ticket, stall, etc.) can call to create Razorpay orders. The form submission payload is forwarded to Razorpay through the `notes` field so it is visible alongside each payment in your Razorpay dashboard.

## Prerequisites

- Node.js 18+
- npm 9+
- Razorpay account credentials (key id & key secret)

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create your environment file**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and set:
   - `PORT` (optional – defaults to `4000`)
   - `ALLOWED_ORIGINS` (comma separated list of frontend origins, e.g. `https://madooza.com,https://app.madooza.com`)
   - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (use the live keys you shared)

3. **Run the server**
   ```bash
   npm run dev
   ```
   or for production:
   ```bash
   npm start
   ```

The server will listen on `http://localhost:4000` by default and expose a health check at `/health`.

## Creating Razorpay orders

Send a POST request to `/api/orders/{formType}` where `{formType}` is something like `cosplay`, `ticket`, or `stall`.

Example request:

```http
POST /api/orders/cosplay HTTP/1.1
Content-Type: application/json

{
  "amount": 999,              // amount in rupees
  "currency": "INR",         // optional, defaults to INR
  "receipt": "cosplay-001",  // optional custom receipt id
  "formData": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+91-99999-99999",
    "category": "Anime"
  },
  "metadata": {
    "requested_slot": "Day 1"
  }
}
```

The server automatically converts the amount to paise (the unit Razorpay expects) and stores the merged `formData` and `metadata` into the Razorpay order `notes`. The API responds with:

```json
{
  "orderId": "order_XXXXXXXXXXXXXX",
  "amount": 99900,
  "currency": "INR",
  "receipt": "cosplay-001",
  "status": "created",
  "razorpayKeyId": "rzp_live_..."
}
```

Use `razorpayKeyId` to initialise the Razorpay checkout on the frontend.

## Deployment notes

- **Render/Railway**: Create a new Node.js service and point it to this folder/repository. Add the environment variables from `.env` to the platform dashboard. Make sure `PORT` matches the value exposed by the platform (Render sets `PORT` automatically).
- **CORS**: Set `ALLOWED_ORIGINS` to the comma separated list of frontend URLs that should be allowed to call the API.
- **Security**: Never commit the real `.env` file. Keep your Razorpay key secret safe and only configure it via environment variables.

## Integrating with the existing frontend

1. On each form submission, call the backend endpoint with the validated form data and the amount for that booking type.
2. Use the response to open Razorpay checkout on the client:
   - Pass `orderId`, `razorpayKeyId`, `amount`, `currency`, and customer details to `Razorpay(options)`.
   - When the checkout succeeds, send the payment signature back to the backend or your CRM if you need to verify the payment server-side (optional follow-up feature).

This backend is intentionally lightweight so you can extend it later with webhook verification or persistent storage if needed.
