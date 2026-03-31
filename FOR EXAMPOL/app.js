// ── LANGUAGE ──
const TRANSLATIONS = {
  he: {
    heroTitle: 'ברוכים הבאים<br>ל-Fortnite Sales',
    heroSub: 'מצא את מה שאתה מחפש במחירים הטובים ביותר',
    heroBadge: 'מוצרים איכותיים',
    sectionTitle: 'המוצרים שלנו',
    buyNow: 'קנה עכשיו',
    adminLogin: 'כניסת מנהל',
    logout: 'יציאה',
    manage: 'ניהול',
    loginTitle: 'כניסת מנהל',
    loginSub: 'רק מנהל מורשה יכול להתחבר',
    emailLabel: 'אימייל',
    passLabel: 'סיסמה',
    loginBtn: 'כניסה',
    checkoutTitle: 'השלמת הזמנה',
    payMethod: 'שיטת תשלום',
    fullName: 'שם מלא',
    emailAccess: 'אימייל (לקבלת פרטי הגישה)',
    phone: 'טלפון (אופציונלי)',
    confirmOrder: 'אשר הזמנה',
    dir: 'rtl'
  },
  en: {
    heroTitle: 'Welcome to<br>Fortnite Sales',
    heroSub: 'Find what you\'re looking for at the best prices',
    heroBadge: 'Quality Products',
    sectionTitle: 'Our Products',
    buyNow: 'Buy Now',
    adminLogin: 'Admin Login',
    logout: 'Logout',
    manage: 'Manage',
    loginTitle: 'Admin Login',
    loginSub: 'Only authorized admin can login',
    emailLabel: 'Email',
    passLabel: 'Password',
    loginBtn: 'Login',
    checkoutTitle: 'Complete Order',
    payMethod: 'Payment Method',
    fullName: 'Full Name',
    emailAccess: 'Email (to receive access details)',
    phone: 'Phone (optional)',
    confirmOrder: 'Confirm Order',
    dir: 'ltr'
  }
};

let currentLang = 'he';

function setLang(lang) {
  currentLang = lang;
  sessionStorage.setItem('lang', lang);
  const t = TRANSLATIONS[lang];
  document.documentElement.dir = t.dir;
  document.documentElement.lang = lang;

  document.querySelector('.hero h1').innerHTML        = t.heroTitle;
  document.querySelector('.hero p').textContent       = t.heroSub;
  document.querySelector('.hero-badge').lastChild.textContent = ' ' + t.heroBadge;
  document.querySelector('.section-header h2').textContent   = t.sectionTitle;
  document.getElementById('navLoginBtn').lastChild.textContent  = ' ' + t.adminLogin;
  document.getElementById('navLogoutBtn').lastChild.textContent = ' ' + t.logout;
  document.getElementById('navAdminBtn').lastChild.textContent  = ' ' + t.manage;
  document.querySelector('.form-card-header h2').textContent    = t.loginTitle;
  document.querySelector('.form-card-header p').textContent     = t.loginSub;
  document.querySelector('label[for="loginEmail"], #page-login label:first-of-type') && null;
  document.querySelector('.checkout-title').lastChild.textContent = ' ' + t.checkoutTitle;
  document.getElementById('submitBtn').lastChild.textContent    = ' ' + t.confirmOrder;

  // hide lang screen permanently
  const screen = document.getElementById('langScreen');
  screen.style.opacity = '0';
  screen.style.transition = 'opacity 0.4s ease';
  setTimeout(() => { screen.style.display = 'none'; }, 400);

  showPage('shop');
}

// ── CONFIG ──
const ADMIN_EMAIL = 'noamnoc66@gmail.com';
const ADMIN_PASSWORD_KEY = 'admin_password';
const PRODUCTS_KEY = 'shop_products';
const SESSION_KEY = 'admin_session';

// EmailJS — replace with your keys from emailjs.com
const EMAILJS_SERVICE_ID  = 'service_ohf4ght';
const EMAILJS_TEMPLATE_ID = 'template_rc4qrjh';
const EMAILJS_PUBLIC_KEY  = 'bJI81fQKD9wIDHmT6';

// ── STORAGE ──
function getProducts() {
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
}
function saveProducts(p) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(p));
}

// ── IMAGE COMPRESSION ──
function compressImage(dataUrl, maxWidth, quality) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

// ── FIRESTORE PRODUCTS ──
async function fsAddProduct(product) {
  if (!window._db) return saveProducts([...getProducts(), product]);
  await window._addDoc(window._collection(window._db, 'products'), product);
}

async function fsGetProducts() {
  if (!window._db) return getProducts();
  const snap = await window._getDocs(window._collection(window._db, 'products'));
  return snap.docs.map(d => ({ ...d.data(), _fsId: d.id }));
}

async function fsDeleteProduct(id) {
  if (!window._db) { saveProducts(getProducts().filter(p => p.id !== id)); return; }
  // id could be local id or firestore id
  const snap = await window._getDocs(window._collection(window._db, 'products'));
  const match = snap.docs.find(d => d.data().id === id || d.id === id);
  if (match) await window._deleteDoc(window._doc(window._db, 'products', match.id));
}

async function fsClearProducts() {
  if (!window._db) { saveProducts([]); return; }
  const snap = await window._getDocs(window._collection(window._db, 'products'));
  await Promise.all(snap.docs.map(d => window._deleteDoc(window._doc(window._db, 'products', d.id))));
}
function isAdmin() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

// ── PAGE ROUTER ──
let currentCheckoutId = null;

function showPage(name) {
  // Guard admin page
  if (name === 'admin' && !isAdmin()) { showPage('login'); return; }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');

  // Nav buttons
  document.getElementById('navLoginBtn').style.display  = isAdmin() ? 'none' : '';
  document.getElementById('navLogoutBtn').style.display = isAdmin() ? '' : 'none';
  document.getElementById('navAdminBtn').style.display  = isAdmin() ? '' : 'none';

  if (name === 'shop')  renderProducts();
  if (name === 'admin') { renderAdminProducts(); renderAdminOrders(); }
  if (name === 'checkout' && currentCheckoutId) fillCheckout(currentCheckoutId);
}

// ── LOGIN ──
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;

  if (email !== ADMIN_EMAIL) {
    showFormAlert('loginError', 'loginErrorText', 'אימייל לא מורשה.', 'error');
    return;
  }
  const stored = localStorage.getItem(ADMIN_PASSWORD_KEY) || 'Admin123!';
  if (pass !== stored) {
    showFormAlert('loginError', 'loginErrorText', 'סיסמה שגויה.', 'error');
    return;
  }
  sessionStorage.setItem(SESSION_KEY, 'true');
  showPage('admin');
});

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  showPage('shop');
}

// ── ADMIN: ADD PRODUCT ──
document.getElementById('productImage').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('imagePreview');
    img.src = e.target.result;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

document.getElementById('addProductForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name  = document.getElementById('productName').value.trim();
  const desc  = document.getElementById('productDesc').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const file  = document.getElementById('productImage').files[0];

  if (!name || !desc || !price || !file) {
    showFormAlert('addMsg', 'addMsgText', 'יש למלא את כל השדות.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = async ev => {
    // compress image before saving to Firestore
    const compressed = await compressImage(ev.target.result, 800, 0.7);
    const product = { id: Date.now().toString(), name, desc, price, image: compressed };
    await fsAddProduct(product);
    showFormAlert('addMsg', 'addMsgText', 'המוצר נוסף בהצלחה!', 'success');
    document.getElementById('addProductForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    renderAdminProducts();
    renderProducts();
  };
  reader.readAsDataURL(file);
});

async function renderAdminProducts() {
  const list = document.getElementById('adminProductList');
  list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">טוען...</p>';
  const products = await fsGetProducts();
  if (products.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">אין מוצרים עדיין.</p>';
    return;
  }
  list.innerHTML = products.map(p => `
    <div class="admin-item">
      <img src="${p.image}" alt="${p.name}">
      <div class="info">
        <h4>${p.name}</h4>
        <span>₪${parseFloat(p.price).toFixed(2)}</span>
      </div>
      <button class="btn-danger" onclick="deleteProduct('${p.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
        מחק
      </button>
    </div>
  `).join('');
}

async function deleteProduct(id) {
  await fsDeleteProduct(id);
  renderAdminProducts();
}

async function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div><p>טוען מוצרים...</p></div>';
  const products = await fsGetProducts();
  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div><p>אין מוצרים זמינים כרגע</p></div>`;
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="openProductModal('${p.id}')">
      <img src="${p.image}" alt="${p.name}">
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
        <div class="card-footer">
          <span class="price">₪${parseFloat(p.price).toFixed(2)}</span>
          <button class="btn btn-primary" onclick="event.stopPropagation(); goCheckout('${p.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-8.42H6"/>
            </svg>
            קנה עכשיו
          </button>
        </div>
      </div>
    </div>
  `).join('');
  // cache for modal/checkout use
  window._cachedProducts = products;
}

// ── PRODUCT MODAL ──
let modalProductId = null;

async function openProductModal(id) {
  const products = window._cachedProducts || await fsGetProducts();
  const product = products.find(p => p.id === id);
  if (!product) return;
  modalProductId = id;
  document.getElementById('modalProductImg').src   = product.image;
  document.getElementById('modalProductImg').alt   = product.name;
  document.getElementById('modalProductName').textContent  = product.name;
  document.getElementById('modalProductDesc').textContent  = product.desc;
  document.getElementById('modalProductPrice').textContent = `₪${parseFloat(product.price).toFixed(2)}`;
  document.getElementById('productModal').classList.add('active');
}

function closeProductModal(e) {
  if (e.target === document.getElementById('productModal')) {
    document.getElementById('productModal').classList.remove('active');
  }
}

function buyFromModal() {
  document.getElementById('productModal').classList.remove('active');
  if (modalProductId) goCheckout(modalProductId);
}

// ── PAYMENT ──
const PAYMENT_SETTINGS_KEY = 'payment_settings';

function getPaymentSettings() {
  return JSON.parse(localStorage.getItem(PAYMENT_SETTINGS_KEY) || JSON.stringify({
    paypalEmail: 'noamnoc66@gmail.com',
    bitPhone: '054-217-8023',
    bitName: 'אריאל נוחי',
    bankOwner: 'אריאל נוחי',
    bankName: 'מזרחי - 20',
    bankBranch: '423 - מרכז עסקים רעננה',
    bankAccount: '341078'
  }));
}

const PAYMENT_IDS = ['pay-paypal', 'pay-bit', 'pay-bank'];
let selectedPayment = null;
let selectedPaymentIndex = -1;

async function selectPayment(index) {
  selectedPaymentIndex = index;
  selectedPayment = ['paypal', 'bit', 'bank'][index];

  // highlight selected option
  PAYMENT_IDS.forEach((id, i) => {
    document.getElementById(id).classList.toggle('selected', i === index);
  });

  // show panels wrap with animation
  const wrap = document.getElementById('paymentPanelsWrap');
  wrap.classList.remove('hidden');
  wrap.classList.add('visible');

  // slide to correct panel
  const track = document.getElementById('paymentPanelsTrack');
  track.style.transform = `translateX(${index * 100}%)`;

  // fill values
  const settings = getPaymentSettings();
  const products2 = window._cachedProducts || await fsGetProducts();
  const product  = products2.find(p => p.id === currentCheckoutId);
  const amount   = product ? `₪${parseFloat(product.price).toFixed(2)}` : '';

  document.getElementById('bitAmount').textContent  = amount;
  document.getElementById('bitPhone').textContent   = settings.bitPhone;
  document.getElementById('bitName').textContent    = `שם: ${settings.bitName}`;
  document.getElementById('bankAmount').textContent  = amount;
  document.getElementById('bankName').textContent    = settings.bankName;
  document.getElementById('bankBranch').textContent  = settings.bankBranch;
  document.getElementById('bankAccount').textContent = settings.bankAccount;
  document.getElementById('bankOwner').textContent   = settings.bankOwner;
}

function previewBankReceipt(input) {
  const file = input.files[0];
  if (!file) return;
  const area    = document.getElementById('bankUploadArea');
  const preview = document.getElementById('bankReceiptPreview');
  const label   = document.getElementById('bankUploadLabel');
  area.classList.add('has-file');
  label.textContent = file.name;
  const reader = new FileReader();
  reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
  reader.readAsDataURL(file);
}

async function sendBankReceipt() {
  const file    = document.getElementById('bankReceiptFile').files[0];
  const name    = document.getElementById('buyerName').value.trim();
  const email   = document.getElementById('buyerEmail').value.trim();
  const product = getProducts().find(p => p.id === currentCheckoutId);

  if (!file)           { showBankMsg('יש להעלות צילום מסך של אישור ההעברה.', 'error'); return; }
  if (!name || !email) { showBankMsg('יש למלא שם ואימייל למעלה קודם.', 'error'); return; }

  const btn = document.getElementById('bankSendBtn');
  btn.disabled = true;
  btn.textContent = 'שולח...';

  const formData = new FormData();
  formData.append('name',    name);
  formData.append('email',   email);
  formData.append('product', product ? product.name : '');
  formData.append('amount',  product ? `₪${product.price.toFixed(2)}` : '');
  formData.append('method',  'העברה בנקאית');
  formData.append('receipt', file);

  try {
    const res = await fetch('https://formspree.io/f/mqegpdbn', {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      showBankMsg('האישור נשלח! נאמת ונשלח פרטי גישה בקרוב.', 'success');
      document.getElementById('bankUploadArea').classList.remove('has-file');
      document.getElementById('bankReceiptPreview').style.display = 'none';
      document.getElementById('bankUploadLabel').textContent = 'לחץ להעלאת צילום מסך';
      document.getElementById('bankReceiptFile').value = '';
    } else {
      showBankMsg('שגיאה בשליחה, נסה שוב.', 'error');
    }
  } catch(err) { showBankMsg('שגיאה בשליחה, נסה שוב.', 'error'); }

  btn.disabled = false;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> שלח אישור העברה`;
}

function showBankMsg(msg, type) {
  const el = document.getElementById('bankSendMsg');
  el.style.display = 'block';
  el.style.color = type === 'success' ? 'var(--success)' : 'var(--danger)';
  el.textContent = msg;
}

function previewReceipt(input) {
  const file = input.files[0];
  if (!file) return;
  const area    = document.getElementById('bitUploadArea');
  const preview = document.getElementById('bitReceiptPreview');
  const label   = document.getElementById('bitUploadLabel');
  area.classList.add('has-file');
  label.textContent = file.name;
  const reader = new FileReader();
  reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
  reader.readAsDataURL(file);
}

async function sendBitReceipt() {
  const file    = document.getElementById('bitReceiptFile').files[0];
  const name    = document.getElementById('buyerName').value.trim();
  const email   = document.getElementById('buyerEmail').value.trim();
  const product = getProducts().find(p => p.id === currentCheckoutId);

  if (!file)          { showBitMsg('יש להעלות צילום מסך של הקבלה.', 'error'); return; }
  if (!name || !email){ showBitMsg('יש למלא שם ואימייל למעלה קודם.', 'error'); return; }

  const btn = document.getElementById('bitSendBtn');
  btn.disabled = true;
  btn.textContent = 'שולח...';

  const formData = new FormData();
  formData.append('name',    name);
  formData.append('email',   email);
  formData.append('product', product ? product.name : '');
  formData.append('amount',  product ? `₪${product.price.toFixed(2)}` : '');
  formData.append('receipt', file);

  try {
    const res = await fetch('https://formspree.io/f/mqegpdbn', {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      showBitMsg('הקבלה נשלחה! נאשר ונשלח פרטי גישה בקרוב.', 'success');
      document.getElementById('bitUploadArea').classList.remove('has-file');
      document.getElementById('bitReceiptPreview').style.display = 'none';
      document.getElementById('bitUploadLabel').textContent = 'לחץ להעלאת צילום מסך';
      document.getElementById('bitReceiptFile').value = '';
    } else {
      showBitMsg('שגיאה בשליחה, נסה שוב.', 'error');
    }
  } catch(err) { showBitMsg('שגיאה בשליחה, נסה שוב.', 'error'); }

  btn.disabled = false;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> שלח קבלה לאישור`;
}

function showBitMsg(msg, type) {
  const el = document.getElementById('bitSendMsg');
  el.style.display = 'block';
  el.style.color = type === 'success' ? 'var(--success)' : 'var(--danger)';
  el.textContent = msg;
}

function openBitEmail() {
  const name    = document.getElementById('buyerName').value.trim() || 'לקוח';
  const product = getProducts().find(p => p.id === currentCheckoutId);
  const pname   = product ? product.name : 'מוצר';
  const amount  = product ? `₪${product.price.toFixed(2)}` : '';
  const subject = encodeURIComponent(`אישור תשלום Bit — ${pname} — ${name}`);
  const body    = encodeURIComponent(`שלום,\n\nשילמתי ${amount} עבור: ${pname}\nשם: ${name}\n\nמצורף צילום מסך של הקבלה.`);
  window.open(`mailto:noamnoc66@gmail.com?subject=${subject}&body=${body}`, '_blank');
}

// ── PAYMENT SETTINGS ──
function openPaymentSettings(tab) {
  tab = tab || 'paypal';
  const s = getPaymentSettings();
  document.getElementById('set-paypal-email').value  = s.paypalEmail;
  document.getElementById('set-bit-phone').value     = s.bitPhone;
  document.getElementById('set-bit-name').value      = s.bitName;
  document.getElementById('set-bank-owner').value    = s.bankOwner;
  document.getElementById('set-bank-name').value     = s.bankName;
  document.getElementById('set-bank-branch').value   = s.bankBranch;
  document.getElementById('set-bank-account').value  = s.bankAccount;
  switchSettingsTab(tab);
  document.getElementById('paymentSettingsModal').classList.add('active');
}

function savePaymentSettings() {
  const s = {
    paypalEmail:  document.getElementById('set-paypal-email').value.trim(),
    bitPhone:     document.getElementById('set-bit-phone').value.trim(),
    bitName:      document.getElementById('set-bit-name').value.trim(),
    bankOwner:    document.getElementById('set-bank-owner').value.trim(),
    bankName:     document.getElementById('set-bank-name').value.trim(),
    bankBranch:   document.getElementById('set-bank-branch').value.trim(),
    bankAccount:  document.getElementById('set-bank-account').value.trim()
  };
  localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(s));
  document.getElementById('paymentSettingsModal').classList.remove('active');
}

function closeSettingsModal(e) {
  if (e.target === document.getElementById('paymentSettingsModal')) {
    document.getElementById('paymentSettingsModal').classList.remove('active');
  }
}

function switchSettingsTab(tab) {
  document.querySelectorAll('.settings-tab').forEach((t, i) => {
    const tabs = ['paypal', 'bit', 'bank'];
    t.classList.toggle('active', tabs[i] === tab);
  });
  document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('stab-' + tab).classList.add('active');
}

// ── CHECKOUT ──
function goCheckout(id) {
  currentCheckoutId = id;
  showPage('checkout');
}

async function fillCheckout(id) {
  const products = window._cachedProducts || await fsGetProducts();
  const product = products.find(p => p.id === id);
  if (!product) { showPage('shop'); return; }
  document.getElementById('checkoutImg').src   = product.image;
  document.getElementById('checkoutImg').alt   = product.name;
  document.getElementById('checkoutName').textContent  = product.name;
  document.getElementById('checkoutDesc').textContent  = product.desc;
  document.getElementById('checkoutTotal').textContent = `₪${parseFloat(product.price).toFixed(2)}`;
}

document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name  = document.getElementById('buyerName').value.trim();
  const email = document.getElementById('buyerEmail').value.trim();
  const phone = document.getElementById('buyerPhone').value.trim();

  if (!name || !email) {
    showFormAlert('checkoutMsg', 'checkoutMsgText', 'יש למלא שם ואימייל.', 'error');
    return;
  }
  if (!selectedPayment) {
    showFormAlert('checkoutMsg', 'checkoutMsgText', 'יש לבחור שיטת תשלום.', 'error');
    return;
  }

  if (selectedPayment === 'bit') {
    const file = document.getElementById('bitReceiptFile').files[0];
    if (!file) {
      showFormAlert('checkoutMsg', 'checkoutMsgText', 'יש להעלות צילום מסך של קבלת Bit.', 'error');
      return;
    }
  }

  if (selectedPayment === 'bank') {
    const file = document.getElementById('bankReceiptFile').files[0];
    if (!file) {
      showFormAlert('checkoutMsg', 'checkoutMsgText', 'יש להעלות צילום מסך של אישור ההעברה הבנקאית.', 'error');
      return;
    }
  }

  const product = getProducts().find(p => p.id === currentCheckoutId);

  // PayPal — redirect
  if (selectedPayment === 'paypal') {
    const s      = getPaymentSettings();
    const amount = product ? product.price.toFixed(2) : '0';
    const desc   = encodeURIComponent(product ? product.name : 'רכישה');
    const url = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(s.paypalEmail)}&item_name=${desc}&amount=${amount}&currency_code=ILS`;
    window.open(url, '_blank');
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> שולח...`;

  try {
    if (typeof emailjs !== 'undefined' && EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID') {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: email,
        to_name: name,
        product_name: product.name,
        product_price: `₪${product.price.toFixed(2)}`,
        buyer_phone: phone || 'לא סופק',
        payment_method: selectedPayment === 'paypal' ? 'PayPal' : selectedPayment === 'bit' ? 'Bit' : 'העברה בנקאית',
        reply_to: ADMIN_EMAIL
      }, EMAILJS_PUBLIC_KEY);
    }
  } catch(err) { console.warn('Email error:', err); }

  document.getElementById('modalEmail').textContent = email;
  document.getElementById('successModal').classList.add('active');

  // save order — include receipt image if uploaded
  const orders = getOrders();
  let receiptImg = null;

  const bitFile  = document.getElementById('bitReceiptFile').files[0];
  const bankFile = document.getElementById('bankReceiptFile').files[0];
  const receiptFile = bitFile || bankFile;

  const saveOrder = (imgData) => {
    orders.push({
      id: Date.now().toString(),
      buyerName: name,
      buyerEmail: email,
      buyerPhone: phone,
      productName: product ? product.name : '',
      price: product ? product.price.toFixed(2) : '0',
      paymentMethod: selectedPayment === 'paypal' ? 'PayPal' : selectedPayment === 'bit' ? 'Bit' : 'העברה בנקאית',
      date: new Date().toISOString(),
      accessSent: false,
      receipt: imgData || null
    });
    saveOrders(orders);
  };

  if (receiptFile) {
    const reader = new FileReader();
    reader.onload = e => saveOrder(e.target.result);
    reader.readAsDataURL(receiptFile);
  } else {
    saveOrder(null);
  }
  document.getElementById('checkoutForm').reset();
  selectedPayment = null;
  selectedPaymentIndex = -1;
  PAYMENT_IDS.forEach(id => document.getElementById(id).classList.remove('selected'));
  const wrap = document.getElementById('paymentPanelsWrap');
  wrap.classList.remove('visible');
  wrap.classList.add('hidden');

  btn.disabled = false;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> אשר הזמנה`;
});

// ── ORDERS ──
const ORDERS_KEY = 'shop_orders';

function getOrders() {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
}
function saveOrders(o) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(o));
}

function renderAdminOrders() {
  const list = document.getElementById('adminOrdersList');
  if (!list) return;
  const orders = getOrders().slice().reverse();
  if (orders.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1.5rem">אין הזמנות עדיין.</p>';
    return;
  }
  list.innerHTML = orders.map(o => `
    <div class="admin-item" style="flex-wrap:wrap;gap:0.8rem">
      <div class="info" style="min-width:0;flex:1">
        <h4 style="margin-bottom:0.2rem">${o.buyerName} — ${o.productName}</h4>
        <span style="font-size:0.82rem;color:var(--text-muted)">${o.buyerEmail} · ₪${o.price} · ${o.paymentMethod} · ${new Date(o.date).toLocaleDateString('he-IL')}</span>
        ${o.receipt ? `<div style="margin-top:0.6rem;display:flex;align-items:center;gap:0.7rem">
          <img src="${o.receipt}" style="max-height:60px;border-radius:8px;object-fit:cover;border:1px solid var(--card-border)">
          <button class="btn btn-outline" style="padding:0.35rem 0.8rem;font-size:0.8rem" onclick="window.open('${o.receipt}','_blank')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            פתח קבלה
          </button>
        </div>` : ''}
      </div>
      <div style="display:flex;gap:0.5rem;align-items:center;flex-shrink:0">
        <span class="order-status ${o.accessSent ? 'sent' : 'pending'}">${o.accessSent ? 'נשלח' : 'ממתין'}</span>
        <button class="btn btn-primary" style="padding:0.4rem 0.9rem;font-size:0.82rem" onclick="openSendAccess('${o.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          שלח גישה
        </button>
        <button class="btn-danger" onclick="deleteOrder('${o.id}')">מחק</button>
      </div>
    </div>
  `).join('');
}

function deleteOrder(id) {
  saveOrders(getOrders().filter(o => o.id !== id));
  renderAdminOrders();
}

let currentOrderId = null;

function openSendAccess(orderId) {
  const order = getOrders().find(o => o.id === orderId);
  if (!order) return;
  currentOrderId = orderId;
  document.getElementById('accessEmail').value    = order.buyerEmail;
  document.getElementById('accessUsername').value = '';
  document.getElementById('accessPassword').value = '';
  document.getElementById('accessNotes').value    = '';
  document.getElementById('sendAccessModal').classList.add('active');
}

async function sendAccessDetails() {
  const username = document.getElementById('accessUsername').value.trim();
  const password = document.getElementById('accessPassword').value.trim();
  const notes    = document.getElementById('accessNotes').value.trim();
  const email    = document.getElementById('accessEmail').value.trim();

  if (!username || !password) {
    alert('יש למלא שם משתמש וסיסמה.');
    return;
  }

  const order = getOrders().find(o => o.id === currentOrderId);

  try {
    if (typeof emailjs !== 'undefined') {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email:     email,
        to_name:      order ? order.buyerName : '',
        product_name: order ? order.productName : '',
        product_price:`₪${order ? order.price : ''}`,
        access_user:  username,
        access_pass:  password,
        access_notes: notes || 'אין הערות',
        reply_to:     ADMIN_EMAIL
      }, EMAILJS_PUBLIC_KEY);
    }
  } catch(err) { console.warn(err); }

  // mark as sent
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === currentOrderId);
  if (idx !== -1) { orders[idx].accessSent = true; saveOrders(orders); }

  document.getElementById('sendAccessModal').classList.remove('active');
  renderAdminOrders();
  alert('פרטי הגישה נשלחו!');
}

// ── UTILS ──
function showFormAlert(wrapperId, textId, msg, type) {
  const el = document.getElementById(wrapperId);
  const tx = document.getElementById(textId);
  el.className = `alert alert-${type}`;
  tx.textContent = msg;
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

async function clearAllProducts() {
  if (!confirm('למחוק את כל המוצרים? פעולה זו לא ניתנת לביטול.')) return;
  await fsClearProducts();
  renderAdminProducts();
  renderProducts();
}

// ── TEST PRODUCT ──
function addTestProduct() {
  const products = getProducts();
  products.push({
    id: Date.now().toString(),
    name: 'מוצר בדיקה',
    desc: 'זה מוצר לבדיקת מערכת המיילים.',
    price: 1,
    image: 'https://placehold.co/400x300/1a1a2e/7c6fff?text=Test'
  });
  saveProducts(products);
  renderAdminProducts();
  renderProducts();
  alert('מוצר בדיקה נוסף!');
}

// ── INIT ──
if (!localStorage.getItem(ADMIN_PASSWORD_KEY)) {
  localStorage.setItem(ADMIN_PASSWORD_KEY, 'Admin123!');
}

function initApp() {
  const savedLang = sessionStorage.getItem('lang');
  if (savedLang) {
    // lang already chosen — just apply it without showing lang screen
    currentLang = savedLang;
    const t = TRANSLATIONS[savedLang];
    document.documentElement.dir  = t.dir;
    document.documentElement.lang = savedLang;
    document.getElementById('langScreen').style.display = 'none';
    showPage('shop');
  } else {
    document.getElementById('langScreen').style.display = 'flex';
  }
}

// wait for Firebase to be ready
if (window._db) {
  initApp();
} else {
  window.addEventListener('firebaseReady', initApp, { once: true });
  // fallback if Firebase takes too long
  setTimeout(() => { if (!window._db) initApp(); }, 3000);
}
