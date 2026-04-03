# 🧈 SS Dairy Products — Full-Stack E-Commerce Website

A complete, production-ready e-commerce website for selling homemade ghee online.
Built with pure HTML/CSS/JS (frontend) + Node.js/Express/MongoDB (backend).

---

## 📁 Folder Structure

```
ss-dairy/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   ├── Admin.js             # Admin user schema
│   │   ├── Order.js             # Order schema
│   │   └── Product.js           # Product schema
│   ├── routes/
│   │   ├── auth.js              # Login + product seeding
│   │   ├── orders.js            # Order CRUD + email notification
│   │   ├── payment.js           # Razorpay integration
│   │   └── products.js          # Product CRUD + image upload
│   ├── uploads/                 # Product images (auto-created)
│   ├── .env.example             # Environment variable template
│   ├── .gitignore
│   ├── package.json
│   └── server.js                # Express entry point
│
├── frontend/
│   ├── css/
│   │   └── style.css            # Full styling — earthy theme
│   ├── js/
│   │   ├── utils.js             # API helper, Cart, Toast, Loader
│   │   └── navbar.js            # Shared navbar + footer injection
│   ├── pages/
│   │   ├── index.html           # Home page with carousel
│   │   ├── products.html        # All products listing
│   │   ├── cart.html            # Cart page
│   │   ├── checkout.html        # Checkout + payment
│   │   ├── success.html         # Order success page
│   │   ├── admin.html           # Admin login
│   │   └── admin-dashboard.html # Admin panel (products + orders)
│   └── index.html               # Root redirect
│
├── render.yaml                  # Render.com deployment config
└── README.md
```

---

## ✅ Features

| Feature | Status |
|---|---|
| Home page with auto-carousel | ✅ |
| Products listing page | ✅ |
| Add to cart / Remove / Quantity | ✅ |
| Checkout form with validation | ✅ |
| Razorpay payment (test mode) | ✅ |
| Cash on Delivery fallback | ✅ |
| Order saved to MongoDB | ✅ |
| Admin email notification | ✅ |
| Admin login (JWT auth) | ✅ |
| Add / Edit / Delete products | ✅ |
| Image upload (local file) | ✅ |
| Order status management | ✅ |
| Mobile responsive | ✅ |
| Toast notifications | ✅ |
| Loading indicators | ✅ |

---

## 🚀 Local Setup (Step by Step)

### Prerequisites
- Node.js v18+ → https://nodejs.org
- MongoDB Atlas account → https://cloud.mongodb.com (free tier)
- Gmail account (for email notifications)
- Razorpay account (optional, test mode) → https://razorpay.com

---

### Step 1 — Clone / Download the project

```bash
# If using git:
git clone https://github.com/yourname/ss-dairy.git
cd ss-dairy

# Or just unzip the downloaded folder
```

---

### Step 2 — Set up MongoDB Atlas (Free)

1. Go to https://cloud.mongodb.com
2. Sign up / Log in → Create a free **M0** cluster
3. Click **Connect** → **Drivers** → Copy the connection string
4. Replace `<password>` with your DB user password
5. Your URI looks like:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/ss-dairy?retryWrites=true&w=majority
   ```
6. In **Network Access**, add IP `0.0.0.0/0` (allow all) for development

---

### Step 3 — Set up Gmail App Password (Free Email)

1. Go to your **Google Account** → **Security**
2. Enable **2-Step Verification** (if not already)
3. Search for **"App Passwords"** → Select
4. App: **Mail**, Device: **Other** → Name it "SS Dairy"
5. Copy the 16-character password (e.g. `abcd efgh ijkl mnop`)

---

### Step 4 — Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ss-dairy?retryWrites=true&w=majority

JWT_SECRET=any_long_random_string_here_make_it_secure

ADMIN_EMAIL=admin@ssdairy.com
ADMIN_PASSWORD=Admin@123

GMAIL_USER=youremail@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop

ADMIN_NOTIFY_EMAIL=youremail@gmail.com

# Razorpay test keys (get from dashboard.razorpay.com → Settings → API Keys)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

PORT=5000
FRONTEND_URL=http://127.0.0.1:5500
```

---

### Step 5 — Install Backend Dependencies

```bash
cd backend
npm install
```

---

### Step 6 — Start the Backend

```bash
npm run dev   # Development (auto-restart on changes)
# or
npm start     # Production
```

You should see:
```
✅ MongoDB Atlas connected
🚀 Server running on port 5000
```

Test the API:
```
http://localhost:5000/
→ {"status":"SS Dairy Products API is running 🧈","version":"1.0.0"}
```

---

### Step 7 — Run the Frontend

**Option A — VS Code Live Server (Recommended)**
1. Install the **Live Server** extension in VS Code
2. Right-click `frontend/pages/index.html` → **Open with Live Server**
3. Opens at `http://127.0.0.1:5500/frontend/pages/index.html`

**Option B — Python HTTP Server**
```bash
cd frontend
python3 -m http.server 5500
# Visit http://localhost:5500/pages/index.html
```

**Option C — Any static server**
```bash
npx serve frontend -p 5500
```

---

### Step 8 — Seed Default Products

Once both backend and frontend are running:

1. Open: `http://127.0.0.1:5500/frontend/pages/admin.html`
2. Login with: `admin@ssdairy.com` / `Admin@123`
3. Click **"Seed Default Products"** link on the dashboard
4. 4 default ghee products will be added

Or call directly:
```bash
curl -X POST http://localhost:5000/api/auth/seed
```

---

## 🔑 Admin Panel

| URL | Purpose |
|---|---|
| `/pages/admin.html` | Admin Login |
| `/pages/admin-dashboard.html` | Full dashboard (auto-redirects if not logged in) |

**Default credentials:**
- Email: `admin@ssdairy.com`
- Password: `Admin@123`

**To change**: Update `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file.

---

## 💳 Razorpay Test Mode

1. Sign up at https://razorpay.com → Dashboard
2. Go to **Settings → API Keys → Generate Test Keys**
3. Copy `Key ID` and `Key Secret` into `.env`
4. In test mode, use these test cards:
   - Card: `4111 1111 1111 1111` | Expiry: any future | CVV: any 3 digits
   - UPI: `success@razorpay`

If Razorpay is not configured, the checkout automatically falls back to **Cash on Delivery**.

---

## 📧 Email Notification Format

When an order is placed, admin receives a beautifully formatted HTML email with:
- Customer name, phone, address
- Itemized product list with quantities
- Total amount
- Payment method

---

## 🌐 Free Deployment

### Backend → Render.com (Free)

1. Push your code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add all environment variables from `.env` in the **Environment** tab
6. Deploy! You get a URL like `https://ss-dairy-backend.onrender.com`

### Frontend → Netlify (Free)

1. Go to https://netlify.com → Add New Site → Deploy manually
2. Drag & drop your `frontend/` folder
3. Your site is live at `https://xxxxx.netlify.app`

**Important:** After deploying backend, update `API_BASE` in `frontend/js/utils.js`:
```js
const API_BASE = 'https://ss-dairy-backend.onrender.com/api';
```

Also update `FRONTEND_URL` in Render environment variables:
```
FRONTEND_URL=https://yoursite.netlify.app
```

### Alternative: GitHub Pages (Frontend only)

1. Go to your GitHub repo → Settings → Pages
2. Set source to the `frontend/` folder

---

## 🔧 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Admin login |
| POST | `/api/auth/seed` | No | Seed default products |
| GET | `/api/products` | No | Get all products |
| POST | `/api/products` | Admin | Add product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/orders` | No | Place order |
| GET | `/api/orders` | Admin | Get all orders |
| PATCH | `/api/orders/:id/status` | Admin | Update order status |
| POST | `/api/payment/create-order` | No | Create Razorpay order |
| POST | `/api/payment/verify` | No | Verify Razorpay payment |

---

## 🎨 Color Theme

| Variable | Color | Usage |
|---|---|---|
| `--cream` | `#FDF6EC` | Page background |
| `--gold` | `#C9A84C` | Buttons, accents |
| `--brown` | `#6B3A1F` | Text, borders |
| `--brown-dark` | `#3E1F0A` | Navbar, footer |

---

## 🛠️ Common Issues

**CORS Error:** Make sure `FRONTEND_URL` in `.env` matches your frontend URL exactly.

**MongoDB connection fails:** Check your IP is whitelisted in Atlas Network Access.

**Email not sending:** Ensure 2FA is on in Gmail and you're using the App Password (not your regular Gmail password).

**Razorpay modal not opening:** Verify your `RAZORPAY_KEY_ID` is correct and starts with `rzp_test_`.

**Images not uploading:** Make sure the `backend/uploads/` folder exists (created automatically on first run).

---

## 📱 Pages Overview

| Page | File | Description |
|---|---|---|
| Home | `index.html` | Hero carousel, features, featured products |
| Products | `products.html` | All products grid |
| Cart | `cart.html` | Cart with qty controls |
| Checkout | `checkout.html` | Order form + payment |
| Success | `success.html` | Order confirmation |
| Admin Login | `admin.html` | Secure login |
| Admin Dashboard | `admin-dashboard.html` | Manage products & orders |

---

Made with ❤️ for SS Dairy Products 🧈
