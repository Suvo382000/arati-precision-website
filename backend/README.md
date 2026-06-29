# ARATI PRECISION INDUSTRIES — Backend API

Node.js + Express backend for the ARATI PRECISION INDUSTRIES website.

---

## Quick Start

### 1. Install Node.js
Download and install Node.js (v16 or newer) from https://nodejs.org

### 2. Install dependencies
```bash
cd "d:\Placement\ARATI WEBSITE\backend"
npm install
```

### 3. Configure environment variables
```bash
# Copy the example file
copy .env.example .env
```

Then open `.env` and fill in your values:

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: 5000) | No |
| `MONGODB_URI` | MongoDB connection string | No (falls back to JSON) |
| `FRONTEND_URL` | Your frontend URL for CORS | Yes |
| `EMAIL_USER` | Gmail address for sending emails | No |
| `EMAIL_PASS` | Gmail App Password (not your login password) | No |
| `ADMIN_EMAIL` | Email to receive enquiry notifications | No |
| `ADMIN_SECRET` | Secret key for admin API access | Yes |
| `NODE_ENV` | `development` or `production` | No |

> **Gmail Setup:** To use Gmail for emails, enable 2-Factor Authentication on your Google account and generate an **App Password** at https://myaccount.google.com/apppasswords — use that as `EMAIL_PASS`.

### 4. Start MongoDB (optional)
The backend works **without MongoDB**. If you don't have MongoDB, enquiries are saved to `data/enquiries.json` automatically.

To install MongoDB: https://www.mongodb.com/try/download/community

### 5. Start the server
```bash
# Development (auto-restarts on changes)
npm run dev

# Production
npm start
```

You should see:
```
╔══════════════════════════════════════════════════╗
║       ⚙  ARATI PRECISION INDUSTRIES  ⚙          ║
║         Precision Engineering Excellence          ║
╠══════════════════════════════════════════════════╣
║  🚀  Server running on port 5000                 ║
╚══════════════════════════════════════════════════╝
```

---

## API Endpoints

### Public

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/enquiry` | Submit a new enquiry |

### Admin (requires `X-Admin-Secret` header)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/enquiries` | List all enquiries (paginated) |
| `GET` | `/api/admin/enquiries?status=new` | Filter by status |
| `GET` | `/api/admin/enquiries?page=2&limit=5` | Paginate results |
| `GET` | `/api/admin/enquiries/:id` | Get single enquiry |
| `PATCH` | `/api/admin/enquiries/:id/status` | Update status |
| `DELETE` | `/api/admin/enquiries/:id` | Delete enquiry |
| `GET` | `/api/admin/stats` | Dashboard statistics |

---

## POST /api/enquiry — Request Body

```json
{
  "name":    "Rajesh Kumar",
  "email":   "rajesh@example.com",
  "phone":   "+91 98765 43210",
  "subject": "gears",
  "message": "We need 500 spur gears, Module 2, 40 teeth, EN36 steel."
}
```

Valid `subject` values: `gears`, `shafts`, `bushes`, `jig-fixtures`, `gauges`, `dies-tools`, `high-precision`, `other`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Enquiry received! We'll contact you within 24 hours.",
  "data": { "id": "abc123..." }
}
```

**Validation Error Response (422):**
```json
{
  "success": false,
  "message": "Validation failed. Please check your input.",
  "errors": {
    "email": "Please provide a valid email address."
  }
}
```

---

## PATCH /api/admin/enquiries/:id/status

**Headers:** `X-Admin-Secret: your_admin_secret_key`

**Body:**
```json
{ "status": "read" }
```

---

## Connecting the Frontend Contact Form

The frontend `js/main.js` has already been updated to send a real `fetch` POST request to this backend. Make sure:

1. The backend is running on port 5000 (`npm run dev`)
2. The frontend `FRONTEND_URL` in `.env` matches where you're serving the HTML

If you're opening the HTML file directly (not from a server), either:
- Use **VS Code Live Server** extension (runs on `http://localhost:5500`)
- Or update `FRONTEND_URL=http://127.0.0.1:5500` in your `.env`

### Manual fetch example (for your own reference):
```javascript
const response = await fetch('http://localhost:5000/api/enquiry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name:    'Test User',
    email:   'test@example.com',
    phone:   '+91 12345 67890',
    subject: 'gears',
    message: 'I need 200 helical gears, module 3.',
  }),
});
const data = await response.json();
console.log(data);
```

---

## Admin API Example

```javascript
// Fetch all new enquiries
const response = await fetch('http://localhost:5000/api/admin/enquiries?status=new', {
  headers: { 'X-Admin-Secret': 'your_admin_secret_key' }
});
const data = await response.json();
console.log(data.data.enquiries);
```

---

## Project Structure

```
backend/
├── server.js              ← Main entry point
├── package.json
├── .env.example           ← Copy to .env and fill values
├── .gitignore
├── config/
│   └── db.js              ← MongoDB / JSON file connection
├── routes/
│   ├── enquiry.js         ← POST /api/enquiry
│   └── admin.js           ← Admin management routes
├── models/
│   └── Enquiry.js         ← Mongoose schema + JSON fallback class
├── middleware/
│   └── validate.js        ← express-validator rules
└── data/
    └── enquiries.json     ← Auto-created if no MongoDB (gitignored)
```

---

## Rate Limits

| Route | Limit |
|---|---|
| `POST /api/enquiry` | 10 requests per 15 minutes per IP |
| `GET/PATCH/DELETE /api/admin/*` | 200 requests per 15 minutes per IP |

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 4
- **Database:** MongoDB (Mongoose) with JSON file fallback
- **Email:** Nodemailer (Gmail)
- **Security:** Helmet, express-rate-limit, CORS
- **Validation:** express-validator
- **Logging:** Morgan
