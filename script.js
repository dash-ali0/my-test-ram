// ---- داده‌های محصولات اولیه ----
const DEFAULT_PRODUCTS = [
  { id: 1, name: 'محصول ۱', price: 200000, img: 'https://via.placeholder.com/400x300?text=Product+1', desc: 'توضیحات کوتاه محصول ۱', available: true },
  { id: 2, name: 'محصول ۲', price: 350000, img: 'https://via.placeholder.com/400x300?text=Product+2', desc: 'توضیحات کوتاه محصول ۲', available: true },
  { id: 3, name: 'محصول ۳', price: 500000, img: 'https://via.placeholder.com/400x300?text=Product+3', desc: 'توضیحات کوتاه محصول ۳', available: true },
  { id: 4, name: 'محصول ۴', price: 750000, img: 'https://via.placeholder.com/400x300?text=Product+4', desc: 'توضیحات کوتاه محصول ۴', available: true },
  { id: 5, name: 'محصول ۵', price: 270000, img: 'https://via.placeholder.com/400x300?text=Product+5', desc: 'توضیحات کوتاه محصول ۵', available: true },
  { id: 6, name: 'محصول ۶', price: 620000, img: 'https://via.placeholder.com/400x300?text=Product+6', desc: 'توضیحات کوتاه محصول ۶', available: true }
];

// ---- مدیر پیش‌فرض ----
const DEFAULT_ADMIN = {
  name: "مدیر",
  email: "admin@gmail.com",
  password: "123456",
  address: "",
  role: "admin"
};

function formatPrice(n) { return n.toLocaleString('fa-IR') + ' تومان'; }

// ---- مدیریت محصولات در localStorage ----
function getProducts() {
  try { return JSON.parse(localStorage.getItem('products') || '[]'); } catch { return []; }
}
function setProducts(products) { localStorage.setItem('products', JSON.stringify(products)); }

function initProducts() {
  let products = getProducts();
  if (products.length === 0) {
    setProducts(DEFAULT_PRODUCTS);
  }
}

// ---- عملیات روی محصولات ----
function deleteProduct(id) {
  if (!isAdmin()) { alert("فقط مدیر می‌تواند محصول حذف کند."); return; }
  let products = getProducts();
  products = products.filter(p => p.id !== id);
  setProducts(products);
  renderProducts(getProducts());
}

function toggleAvailability(id) {
  if (!isAdmin()) { alert("فقط مدیر می‌تواند وضعیت محصول را تغییر دهد."); return; }
  let products = getProducts();
  products = products.map(p => p.id === id ? { ...p, available: !p.available } : p);
  setProducts(products);
  renderProducts(getProducts());
}

function editProduct(id) {
  if (!isAdmin()) { alert("فقط مدیر می‌تواند محصول را ویرایش کند."); return; }
  let products = getProducts();
  const product = products.find(p => p.id === id);
  if (!product) return;

  const newName = prompt("نام جدید:", product.name);
  const newPrice = Number(prompt("قیمت جدید:", product.price));
  const newImg = prompt("لینک تصویر جدید:", product.img);
  const newDesc = prompt("توضیحات جدید:", product.desc);

  product.name = newName || product.name;
  product.price = newPrice || product.price;
  product.img = newImg || product.img;
  product.desc = newDesc || product.desc;

  setProducts(products);
  renderProducts(getProducts());
}

// ---- سبد خرید ----
function getCart() { try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; } }
function setCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); updateNavCartCount(); }

function updateNavCartCount() {
  const el = document.getElementById('navCartCount');
  if (!el) return;
  const count = getCart().reduce((sum, it) => sum + (it.qty || 0), 0);
  el.textContent = count;
}

function addToCartById(id) {
  const p = getProducts().find(x => x.id === id);
  if (!p || !p.available) { alert("این محصول موجود نیست."); return; }
  let cart = getCart();
  const existing = cart.find(x => x.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
  setCart(cart);
  alert(`${p.name} به سبد اضافه شد!`);
}

function changeQty(id, delta) {
  let cart = getCart();
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(x => x.id !== id);
  setCart(cart);
  renderCart();
}

function removeFromCart(id) {
  const cart = getCart().filter(x => x.id !== id);
  setCart(cart);
  renderCart();
}

function clearCart() { setCart([]); renderCart(); }

function renderCart() {
  const body = document.getElementById('cartTableBody');
  const totalEl = document.getElementById('totalPrice');
  if (!body || !totalEl) return;
  const cart = getCart();
  body.innerHTML = '';
  let sum = 0;
  cart.forEach(item => {
    const rowTotal = item.price * item.qty;
    sum += rowTotal;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>
        <button class="btn" onclick="changeQty(${item.id}, -1)">-</button>
        <span style="margin:0 8px">${item.qty}</span>
        <button class="btn" onclick="changeQty(${item.id}, 1)">+</button>
      </td>
      <td>${formatPrice(item.price)}</td>
      <td>${formatPrice(rowTotal)}</td>
      <td><button class="btn danger" onclick="removeFromCart(${item.id})">حذف</button></td>
    `;
    body.appendChild(tr);
  });
  totalEl.textContent = `جمع کل: ${formatPrice(sum)}`;
}
// ---- خرید نهایی و سفارش‌ها ----
function checkout() {
  const cart = getCart();
  if (cart.length === 0) { alert("سبد خرید خالی است!"); return; }

  const address = prompt("لطفاً آدرس خود را وارد کنید:");
  if (!address) { alert("آدرس وارد نشد، خرید لغو شد."); return; }

  const currentUser = getCurrentUser();
  if (!currentUser) { alert("ابتدا باید وارد شوید یا ثبت‌نام کنید."); return; }

  let orders = [];
  try { orders = JSON.parse(localStorage.getItem("orders_" + currentUser.email) || "[]"); } catch {}
  orders.push({ date: new Date().toLocaleString("fa-IR"), address, items: cart });
  localStorage.setItem("orders_" + currentUser.email, JSON.stringify(orders));

  clearCart();
  alert("خرید شما ثبت شد و به بخش ارسالی‌ها اضافه گردید.");
}

function cancelOrder(index) {
  const currentUser = getCurrentUser();
  if (!currentUser) { alert("ابتدا وارد شوید."); return; }

  let orders = [];
  try { orders = JSON.parse(localStorage.getItem("orders_" + currentUser.email) || "[]"); } catch {}

  if (index < 0 || index >= orders.length) return;

  if (!confirm("آیا مطمئن هستید که می‌خواهید این سفارش را لغو کنید؟")) return;

  orders.splice(index, 1);
  localStorage.setItem("orders_" + currentUser.email, JSON.stringify(orders));
  renderOrders();
  alert("سفارش لغو شد.");
}

function renderOrders() {
  const container = document.getElementById("ordersList");
  if (!container) return;
  const currentUser = getCurrentUser();
  if (!currentUser) { container.innerHTML = "<p>برای مشاهده سفارش‌ها وارد شوید.</p>"; return; }

  let orders = [];
  try { orders = JSON.parse(localStorage.getItem("orders_" + currentUser.email) || "[]"); } catch {}
  if (orders.length === 0) { container.innerHTML = "<p>هیچ سفارشی ثبت نشده است.</p>"; return; }

  container.innerHTML = "";
  orders.forEach((order, idx) => {
    const div = document.createElement("div");
    div.className = "order-box";
    div.innerHTML = `
      <h3>تاریخ: ${order.date}</h3>
      <p>آدرس: ${order.address}</p>
      <ul>
        ${order.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join("")}
      </ul>
      <button class="btn danger" onclick="cancelOrder(${idx})">لغو سفارش</button>
    `;
    container.appendChild(div);
  });
}

// ---- محصولات (رندر و فیلتر) ----
function renderProducts(list = getProducts()) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.available ? "قیمت: " + formatPrice(p.price) : "<span style='color:red'>ناموجود</span>"}</p>
      <p>${p.desc}</p>
      <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
        ${p.available ? `<button class="btn" onclick="addToCartById(${p.id})">افزودن به سبد</button>` : ""}
        <a class="btn" href="product.html?id=${p.id}">جزئیات</a>
        ${isAdmin() ? `
          <button class="btn" onclick="editProduct(${p.id})">ویرایش</button>
          <button class="btn danger" onclick="deleteProduct(${p.id})">حذف</button>
          <button class="btn" onclick="toggleAvailability(${p.id})">${p.available ? "ناموجود کن" : "موجود کن"}</button>
        ` : ""}
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterProducts() {
  const q = (document.getElementById('searchInput')?.value || '').trim();
  const price = document.getElementById('priceFilter')?.value || '';
  let list = getProducts().filter(p => p.name.includes(q));
  if (price === 'low') list = list.filter(p => p.price < 300000);
  if (price === 'mid') list = list.filter(p => p.price >= 300000 && p.price <= 600000);
  if (price === 'high') list = list.filter(p => p.price > 600000);
  renderProducts(list);
}

// ---- جزئیات محصول ----
function renderProductDetail() {
  const container = document.getElementById('productDetail');
  if (!container) return;
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id'));
  const products = getProducts();
  const p = products.find(x => x.id === id) || products[0];
  container.innerHTML = `
    <img src="${p.img}" alt="${p.name}">
    <div class="info">
      <h2>${p.name}</h2>
      <p>${p.desc}</p>
      <p>قیمت: ${formatPrice(p.price)}</p>
      ${p.available ? `<button class="btn" onclick="addToCartById(${p.id})">افزودن به سبد</button>` : "<span style='color:red'>ناموجود</span>"}
      <a class="btn" href="products.html">بازگشت</a>
    </div>
  `;
}
// ---- افزودن محصول جدید ----
function handleAddProduct(e) {
  e.preventDefault();
  if (!isAdmin()) { alert("فقط مدیر می‌تواند محصول اضافه کند."); return false; }

  const name = document.getElementById("newProductName")?.value.trim();
  const price = Number(document.getElementById("newProductPrice")?.value);
  const img = document.getElementById("newProductImg")?.value.trim();
  const desc = document.getElementById("newProductDesc")?.value.trim();
  const msg = document.getElementById("addProductMsg");

  if (!name || !price || !img || !desc) { if (msg) msg.textContent = "همه فیلدها الزامی است."; return false; }

  const newProduct = { id: Date.now(), name, price, img, desc, available: true };
  let products = getProducts();
  products.push(newProduct);
  setProducts(products);
  if (msg) msg.textContent = "محصول جدید اضافه شد!";
  e.target.reset();
  return false;
}

// ---- کاربران (ثبت‌نام/ورود/مدیریت) ----
function getUsers() { try { return JSON.parse(localStorage.getItem('users') || '[]'); } catch { return []; } }
function setUsers(users) { localStorage.setItem('users', JSON.stringify(users)); }
function getCurrentUser() { try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; } }
function setCurrentUser(user) { if (user) localStorage.setItem('currentUser', JSON.stringify(user)); else localStorage.removeItem('currentUser'); }

function initAdmin() {
  let users = getUsers();
  if (!users.some(u => u.role === 'admin')) {
    users.push(DEFAULT_ADMIN);
    setUsers(users);
  }
}

function isAdmin() {
  const current = getCurrentUser();
  return current && current.role === 'admin';
}

function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName')?.value.trim();
  const email = document.getElementById('signupEmail')?.value.trim().toLowerCase();
  const pass = document.getElementById('signupPassword')?.value;
  const msg = document.getElementById('signupMsg');

  if (!name || !email || !pass) { if (msg) msg.textContent = 'همه فیلدها الزامی است.'; return false; }
  let users = getUsers();
  if (users.some(u => u.email === email)) { if (msg) msg.textContent = 'این ایمیل قبلاً ثبت شده است.'; return false; }
  users.push({ name, email, password: pass, address: '', role: 'user' });
  setUsers(users);
  if (msg) msg.textContent = 'ثبت‌نام با موفقیت انجام شد.';
  setCurrentUser({ name, email, password: pass, address: '', role: 'user' });
  return false;
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail')?.value.trim().toLowerCase();
  const pass = document.getElementById('loginPassword')?.value;
  const msg = document.getElementById('loginMsg');

  const user = getUsers().find(u => u.email === email && u.password === pass);
  if (!user) { if (msg) msg.textContent = 'ایمیل یا رمز عبور نادرست است.'; return false; }
  setCurrentUser(user);
  if (msg) msg.textContent = 'ورود موفق.';
  return false;
}

// ---- ورود مدیر به حساب کاربر ----
function loginAsUser(index) {
  if (!isAdmin()) { alert("فقط مدیر می‌تواند وارد حساب کاربر شود."); return; }
  const users = getUsers();
  const user = users[index];
  if (!user) return;
  setCurrentUser(user);
  alert(`مدیر وارد حساب ${user.name} شد.`);
  renderProfile();
  renderOrders();
}

function renderUsers() {
  if (!isAdmin()) {
    document.getElementById('usersTableBody').innerHTML = "<p>فقط مدیر دسترسی دارد.</p>";
    return;
  }
  const body = document.getElementById('usersTableBody');
  const countEl = document.getElementById('usersCount');
  if (!body || !countEl) return;
  const users = getUsers();
  body.innerHTML = '';
  users.forEach((u, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>
        <button class="btn danger" onclick="deleteUser(${idx})">حذف</button>
        <button class="btn" onclick="loginAsUser(${idx})">ورود به حساب</button>
      </td>
    `;
    body.appendChild(tr);
  });
  countEl.textContent = `تعداد کاربران: ${users.length}`;
}

function deleteUser(index) {
  if (!isAdmin()) { alert("فقط مدیر می‌تواند کاربر حذف کند."); return; }
  let users = getUsers();
  const removed = users.splice(index, 1)[0];
  setUsers(users);
  const current = getCurrentUser();
  if (current && removed && current.email === removed.email) {
    setCurrentUser(null);
  }
  renderUsers();
}

// ---- پروفایل کاربری ----
function renderProfile() {
  const box = document.getElementById("profileBox");
  if (!box) return;
  const user = getCurrentUser();
  if (!user) {
    box.innerHTML = "<p>ابتدا وارد حساب کاربری شوید.</p>";
    return;
  }

  box.innerHTML = `
    <label>نام:</label>
    <input id="profileName" type="text" value="${user.name || ''}">
    <label>ایمیل:</label>
    <input id="profileEmail" type="email" value="${user.email || ''}" disabled>
    <label>رمز عبور:</label>
    <input id="profilePassword" type="password" value="${user.password || ''}">
    <label>آدرس:</label>
    <textarea id="profileAddress">${user.address || ''}</textarea>
    <div style="display:flex; gap:8px; margin-top:8px;">
      <button class="btn" onclick="saveProfile()">ذخیره تغییرات</button>
      <button class="btn danger" onclick="logout()">خروج از حساب</button>
    </div>
    <p id="profileMsg" class="form-msg"></p>
  `;
}

function saveProfile() {
  const msg = document.getElementById('profileMsg');
  const current = getCurrentUser();
  if (!current) { if (msg) msg.textContent = 'ابتدا وارد شوید.'; return; }

  const name = document.getElementById('profileName')?.value.trim();
  const pass = document.getElementById('profilePassword')?.value;
  const address = document.getElementById('profileAddress')?.value.trim();

  const updatedUser = { ...current, name, password: pass, address };
  setCurrentUser(updatedUser);

  let users = getUsers();
  users = users.map(u => (u.email === updatedUser.email ? updatedUser : u));
  setUsers(users);

  if (msg) msg.textContent = 'پروفایل با موفقیت ذخیره شد.';
}

function logout() {
  setCurrentUser(null);
  alert("از حساب کاربری خارج شدید.");
  location.href = "index.html";
}

// ---- تماس با ما ----
function handleContact(e) {
  e.preventDefault();
  const name = document.getElementById('contactName')?.value.trim();
  const email = document.getElementById('contactEmail')?.value.trim();
  const message = document.getElementById('contactMessage')?.value.trim();
  const msg = document.getElementById('contactMsg');

  if (!name || !email || !message) { if (msg) msg.textContent = 'همه فیلدها الزامی است.'; return false; }
  if (msg) msg.textContent = 'پیام شما ثبت شد (نمایشی).';
  return false;
}

// ---- راه‌اندازی بر اساس صفحه ----
document.addEventListener('DOMContentLoaded', () => {
  initProducts();
  initAdmin(); // مدیر پیش‌فرض را ذخیره کن
  updateNavCartCount();

  if (document.getElementById('productsGrid')) { renderProducts(getProducts()); }
  if (document.getElementById('productDetail')) { renderProductDetail(); }
  if (document.getElementById('cartTableBody')) { renderCart(); }
  if (document.getElementById('usersTableBody')) { renderUsers(); }
  if (document.getElementById('ordersList')) { renderOrders(); }
  if (document.getElementById('profileBox')) { renderProfile(); }
});
