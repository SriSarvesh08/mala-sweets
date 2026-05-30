// =============================================
// Mala Sweets and Ghee — Shared Utilities
// =============================================

// Determine API_BASE dynamically
// - Local dev (localhost:5000 or 5500) → Express backend on port 5000
// - Production (Netlify)              → Netlify proxy (/api → Render backend)
const API_BASE = (() => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:5000/api'; // Local development
  }
  // Production on Netlify: netlify.toml proxies /api/* → Render backend.
  // Using a relative path means same-origin — zero CORS issues.
  return '/api';
})();

// ─── API Helper ───────────────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('adminToken');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body instanceof FormData) delete headers['Content-Type'];

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// ─── Cart Management ──────────────────────────────────────────────────────────
const Cart = {
  get() { return JSON.parse(localStorage.getItem('ssDairyCart') || '[]'); },
  save(items) { localStorage.setItem('ssDairyCart', JSON.stringify(items)); Cart.updateBadge(); },
  add(product) {
    const items = Cart.get();
    const idx = items.findIndex(i => i._id === product._id);
    if (idx >= 0) items[idx].quantity = (items[idx].quantity || 1) + 1;
    else items.push({ ...product, quantity: 1 });
    Cart.save(items);
    showToast(`${product.name} added to cart 🛒`, 'success');
  },
  remove(id) {
    Cart.save(Cart.get().filter(i => i._id !== id));
  },
  update(id, qty) {
    if (qty < 1) { Cart.remove(id); return; }
    const items = Cart.get();
    const idx = items.findIndex(i => i._id === id);
    if (idx >= 0) items[idx].quantity = qty;
    Cart.save(items);
  },
  clear() { localStorage.removeItem('ssDairyCart'); Cart.updateBadge(); },
  total() { return Cart.get().reduce((sum, i) => sum + i.price * (i.quantity || 1), 0); },
  count() { return Cart.get().reduce((sum, i) => sum + (i.quantity || 1), 0); },
  updateBadge() {
    const badges = document.querySelectorAll('.cart-count');
    const count = Cart.count();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: '🧈' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '🧈'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ─── Loader ───────────────────────────────────────────────────────────────────
function showLoader() {
  const existing = document.querySelector('.loader-overlay');
  if (existing) return;
  const el = document.createElement('div');
  el.className = 'loader-overlay';
  el.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(el);
}
function hideLoader() {
  const el = document.querySelector('.loader-overlay');
  if (el) el.remove();
}

// ─── Navbar active link ───────────────────────────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === path || href === './' + path);
  });
}

// ─── Hamburger ────────────────────────────────────────────────────────────────
function initHamburger() {
  const btn = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav-links');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
}

// Init on every page
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
  setActiveNav();
  initHamburger();
});
