const jsdom = require('jsdom');
const fs = require('fs');
const path = require('path');

const { JSDOM } = jsdom;
const html = fs.readFileSync(path.join(__dirname, 'frontend', 'pages', 'checkout.html'), 'utf-8');
const utilsJs = fs.readFileSync(path.join(__dirname, 'frontend', 'js', 'utils.js'), 'utf-8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;
const document = window.document;

// Setup mocks
window.apiFetch = async function(url, opts) {
  console.log('Mock apiFetch called:', url);
  return { order: { _id: '123' }, key: 'rzp_test_123' };
}
window.Razorpay = function(options) {
  console.log('Mock Razorpay instantiated with options:', options);
  this.open = () => console.log('Mock Razorpay opened');
}
window.showError = (msg) => console.error('showError called:', msg);
window.showLoader = () => {};
window.hideLoader = () => {};

// Mock alert
window.alert = console.log;

// Inject utils.js functions
const scriptEl = document.createElement("script");
scriptEl.textContent = utilsJs;
document.head.appendChild(scriptEl);

// Setup form
document.getElementById('name').value = 'Test User';
document.getElementById('phone').value = '+919999999999';
document.getElementById('email').value = 'test@test.com';
document.getElementById('address').value = 'Test Address 123';

window.currentItems = [{
  originalId: '123',
  _id: '123-1kg',
  name: 'Test Product',
  price: 500,
  quantity: 1,
  weight: '1kg'
}];

// Execute button click
try {
  console.log('Clicking button...');
  document.getElementById('placeOrderBtn').click();
  console.log('Button clicked.');
} catch (e) {
  console.error("Crash during click:", e);
}
