// navbar.js — Injects navbar and footer into every page
(function () {
  const navbar = `
  <nav class="navbar">
    <a href="/pages/index.html" class="navbar-brand">
      <div class="logo-icon">🧈</div>
      <div class="logo-text">
        <span>Mala Sweets & Ghee</span>
        <span>Products</span>
      </div>
    </a>
    <ul class="nav-links" id="navLinks">
      <li><a href="/pages/index.html">Home</a></li>
      <li><a href="/pages/products.html">Products</a></li>
      <li><a href="/pages/cart.html" style="position:relative;">
        🛒 Cart
        <span class="cart-count" style="display:none;">0</span>
      </a></li>
    </ul>
    <button class="hamburger" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </nav>`;

  const footer = `
  <footer>
    <div class="footer-grid">
      <div class="footer-brand">
        <h2>🧈 Mala Sweets and Ghee</h2>
        <p>Premium homemade Ghee, Laddus, and Traditional Sweets delivered to your doorstep. Pure ingredients, traditional methods, 100% natural.</p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <ul class="footer-links">
          <li><a href="/pages/index.html">Home</a></li>
          <li><a href="/pages/products.html">Shop Ghee</a></li>
          <li><a href="/pages/cart.html">My Cart</a></li>
          <li><a href="/pages/admin.html">Admin</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact Us</h4>
        <ul class="footer-links">
          <li>📞 +91 95240 56668</li>
          <li>📧 srisarvesh.b78@gmail.com</li>
          <li>📍 Coimbatore, Tamil Nadu</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2024 Mala Sweets and Ghee. All rights reserved. Made with ❤️ in India.</p>
    </div>
  </footer>`;

  // Inject navbar at top immediately (it should be first element)
  const navEl = document.createElement('div');
  navEl.innerHTML = navbar;
  document.body.insertBefore(navEl.firstElementChild, document.body.firstChild);

  // Inject footer AFTER DOM is fully loaded so it goes at the very bottom
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', appendFooter);
  } else {
    // DOM already loaded (in case script runs late)
    appendFooter();
  }

  function appendFooter() {
    const footerEl = document.createElement('div');
    footerEl.innerHTML = footer;
    document.body.appendChild(footerEl.firstElementChild);
  }
})();

