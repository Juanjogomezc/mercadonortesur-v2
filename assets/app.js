/* Mercado Norte Sur — capa de datos del flujo (demo en el navegador).
   Guarda usuarios, publicaciones y pedidos en localStorage. Para producción se reemplaza por backend. */
const SEED = [
    {cat:'camping', name:'Carpa Doite Kaiku 4 personas', price:89990, oldPrice:140000, cond:'usado', seller:'Camila R.', loc:'Puerto Varas', img:'https://picsum.photos/seed/mns-tent1/500/500'},
    {cat:'camping', name:'Saco de dormir Kelty -5°C', price:54990, oldPrice:null, cond:'nuevo', seller:'TiendaAndes', loc:'Santiago', img:'https://picsum.photos/seed/mns-sleepingbag/500/500'},
    {cat:'camping', name:'Cocinilla portátil MSR WhisperLite', price:38000, oldPrice:52000, cond:'usado', seller:'Rodrigo P.', loc:'Temuco', img:'https://picsum.photos/seed/mns-stove/500/500'},
    {cat:'escalada', name:'Arnés de escalada Black Diamond', price:42000, oldPrice:null, cond:'nuevo', seller:'VertexGear', loc:'Santiago', img:'https://picsum.photos/seed/mns-harness/500/500'},
    {cat:'escalada', name:'Cuerda dinámica 60m Mammut', price:95000, oldPrice:130000, cond:'usado', seller:'Ignacio T.', loc:'Valdivia', img:'https://picsum.photos/seed/mns-rope/500/500'},
    {cat:'escalada', name:'Casco de escalada Petzl Meteor', price:36000, oldPrice:null, cond:'nuevo', seller:'VertexGear', loc:'Santiago', img:'https://picsum.photos/seed/mns-climb-helmet/500/500'},
    {cat:'trekking', name:'Botas Salomon Quest 4D GTX 42', price:65000, oldPrice:120000, cond:'usado', seller:'Ignacio T.', loc:'Valdivia', img:'https://picsum.photos/seed/mns-boots1/500/500'},
    {cat:'trekking', name:'Bastones de trekking Black Diamond', price:28000, oldPrice:null, cond:'nuevo', seller:'OutdoorPro', loc:'Concepción', img:'https://picsum.photos/seed/mns-poles/500/500'},
    {cat:'trekking', name:'Mochila Osprey Atmos AG 65L', price:210000, oldPrice:null, cond:'nuevo', seller:'TiendaAndes', loc:'Santiago', img:'https://picsum.photos/seed/mns-backpack1/500/500'},
    {cat:'surf', name:'Tabla de surf shortboard 6\'2"', price:180000, oldPrice:240000, cond:'usado', seller:'Matías C.', loc:'Pichilemu', img:'https://picsum.photos/seed/mns-surfboard/500/500'},
    {cat:'surf', name:'Traje de neopreno 3/2mm', price:75000, oldPrice:null, cond:'nuevo', seller:'SurfShop Sur', loc:'Concón', img:'https://picsum.photos/seed/mns-wetsuit/500/500'},
    {cat:'pesca', name:'Caña de pescar spinning Shimano', price:32000, oldPrice:45000, cond:'usado', seller:'Pedro A.', loc:'Puerto Montt', img:'https://picsum.photos/seed/mns-rod/500/500'},
    {cat:'pesca', name:'Kayak de pesca inflable', price:220000, oldPrice:null, cond:'nuevo', seller:'RíoSur', loc:'Valdivia', img:'https://picsum.photos/seed/mns-kayak/500/500'},
    {cat:'ciclismo', name:'Bicicleta MTB rodado 29 Trek', price:450000, oldPrice:590000, cond:'usado', seller:'BikeStore', loc:'Santiago', img:'https://picsum.photos/seed/mns-mtb/500/500'},
    {cat:'ciclismo', name:'Casco de ciclismo MET Trenta', price:58000, oldPrice:null, cond:'nuevo', seller:'BikeStore', loc:'Santiago', img:'https://picsum.photos/seed/mns-bike-helmet/500/500'},
    {cat:'nieve', name:'Tabla de snowboard Burton Custom', price:270000, oldPrice:350000, cond:'usado', seller:'Andes Snow', loc:'Chillán', img:'https://picsum.photos/seed/mns-snowboard/500/500'},
    {cat:'nieve', name:'Chaqueta técnica para nieve Columbia', price:85000, oldPrice:null, cond:'nuevo', seller:'Andes Snow', loc:'Chillán', img:'https://picsum.photos/seed/mns-skiwear/500/500'},
    {cat:'navegacion', name:'GPS Garmin GPSMAP 66i', price:310000, oldPrice:null, cond:'nuevo', seller:'OutdoorPro', loc:'Concepción', img:'https://picsum.photos/seed/mns-gps/500/500'},
    {cat:'navegacion', name:'Chaleco salvavidas náutico', price:29000, oldPrice:39000, cond:'usado', seller:'Marina Sur', loc:'Valparaíso', img:'https://picsum.photos/seed/mns-lifejacket/500/500'},
    {cat:'servicios', name:'Arriendo kayak inflable — medio día', price:15000, cond:'servicio', seller:'RíoSur Rentals', loc:'Valdivia', img:'https://picsum.photos/seed/mns-serv-kayak/500/500'},
    {cat:'servicios', name:'Tour guiado Torres del Paine 3D/2N', price:180000, cond:'servicio', seller:'Andes Trek Tours', loc:'Puerto Natales', img:'https://picsum.photos/seed/mns-serv-tour/500/500'},
    {cat:'servicios', name:'Arriendo bicicleta MTB — día completo', price:25000, cond:'servicio', seller:'BikeStore', loc:'Santiago', img:'https://picsum.photos/seed/mns-serv-bike/500/500'},
    {cat:'servicios', name:'Clase de escalada con guía certificado', price:45000, cond:'servicio', seller:'VertexGear', loc:'Santiago', img:'https://picsum.photos/seed/mns-serv-climb/500/500'},
  ];
const MNS = (() => {
  const K = 'mns_db';
  let db; try { db = JSON.parse(localStorage.getItem(K)); } catch (e) {}
  db = db || { users: [], me: null, listings: [], orders: [] };
  const save = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch (e) {} };
  const CART_KEY = 'mns_cart';
  const readCart = () => { try { const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch (e) { return []; } };
  const writeCart = items => { try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {} window.dispatchEvent(new Event('mns:cart-updated')); };
  const cartCount = () => readCart().reduce((sum, item) => sum + Math.max(1, Number(item.qty) || 1), 0);
  const refreshCartBadge = () => {
    const count = cartCount();
    document.querySelectorAll('.cart-dot').forEach(dot => { dot.textContent = count; dot.style.display = count ? '' : 'none'; });
    document.querySelectorAll('[data-cart-link]').forEach(link => link.href = (link.dataset.cartBase || '') + 'cuenta/carrito.html');
    return count;
  };
  const money = n => '$' + n.toLocaleString('es-CL');
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanRut = (s = '') => { const c = s.replace(/[^0-9kK]/g, '').toUpperCase(); return c.length < 2 ? '' : c.slice(0, -1) + '-' + c.slice(-1); };
  function validRut(s) {
    const r = cleanRut(s); if (!r) return false;
    const [b, d] = r.split('-'); let sum = 0, m = 2;
    for (let i = b.length - 1; i >= 0; i--) { sum += +b[i] * m; m = m === 7 ? 2 : m + 1; }
    const e = 11 - sum % 11; return d === (e === 11 ? '0' : e === 10 ? 'K' : String(e));
  }
  const me = () => db.users.find(u => u.id === db.me) || null;
  const taken = id => db.orders.some(o => o.lid === id && ['PAID_HELD', 'SHIPPED', 'RELEASED'].includes(o.status));
  const all = () => SEED.map((p, i) => ({ ...p, id: 's' + i, sellerId: 'seed' })).concat(db.listings);
  const catalog = () => all().filter(p => (p.status || 'active') === 'active' && !taken(p.id));
  const find = id => all().find(p => p.id === id);
  return {
    money, me, catalog, find, validRut, db: () => db,
    getCart: readCart, cartCount, refreshCartBadge,
    addToCart(product) {
      if (!product || !product.id) return false;
      const items = readCart(), existing = items.find(item => item.id === product.id);
      if (existing) existing.qty = Math.min(99, (Number(existing.qty) || 1) + 1);
      else items.push({ id: String(product.id), qty: 1, snapshot: {
        name: product.name || product.title || 'Producto',
        price: Number(product.price) || 0,
        image: product.image || product.img || (Array.isArray(product.images) ? product.images[0] : ''),
        seller: product.seller || product.sellerName || 'Vendedor',
        category: product.category || product.cat || '',
        location: product.location || product.loc || ''
      }});
      writeCart(items); return true;
    },
    updateCartQuantity(id, qty) {
      const items = readCart(), item = items.find(row => row.id === id);
      if (!item) return;
      const amount = Math.floor(Number(qty));
      if (!Number.isFinite(amount) || amount < 1) return this.removeFromCart(id);
      item.qty = Math.min(99, amount); writeCart(items);
    },
    removeFromCart(id) { writeCart(readCart().filter(item => item.id !== id)); },
    clearCart() { writeCart([]); },
    register(f) {
      const email = f.email.trim().toLowerCase(), rut = cleanRut(f.rut);
      if (!f.name.trim()) return 'Escribe tu nombre.';
      if (!validRut(f.rut)) return 'El RUT no es válido. Revisa el dígito verificador.';
      if (f.pass.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
      if (db.users.some(u => u.rut === rut || u.email === email)) return 'Ya existe una cuenta con ese RUT o correo.';
      const u = { id: 'u' + Date.now(), name: f.name.trim(), email, rut, pass: f.pass };
      db.users.push(u); db.me = u.id; save(); return '';
    },
    login(f) {
      const u = db.users.find(u => u.email === f.email.trim().toLowerCase() && u.pass === f.pass);
      if (!u) return 'Correo o contraseña incorrectos.'; db.me = u.id; save(); return '';
    },
    logout() { db.me = null; save(); },
    publish(p) {
      const id = 'l' + Date.now();
      db.listings.unshift({ id, name: p.name, cat: norm(p.cat), price: p.price, oldPrice: p.old || null, cond: p.cond,
        seller: me().name, loc: p.loc, desc: p.desc || '', img: 'https://picsum.photos/seed/mns-' + id + '/500/500', sellerId: db.me, status: 'review' });
      save(); return id;
    },
    approve(id) { db.listings.find(l => l.id === id).status = 'active'; save(); },
    buy(lid) {
      const p = find(lid); if (p.sellerId === db.me) return { err: 'No puedes comprar tu propia publicación.' };
      const o = { id: 'o' + Date.now(), lid, buyer: db.me, amount: p.price, status: 'PENDING', track: '' };
      db.orders.push(o); save(); return { id: o.id };
    },
    pay(oid, ok) { db.orders.find(o => o.id === oid).status = ok ? 'PAID_HELD' : 'CANCELLED'; save(); },
    ship(oid, t) { const o = db.orders.find(o => o.id === oid); o.status = 'SHIPPED'; o.track = t; save(); },
    deliver(oid) { db.orders.find(o => o.id === oid).status = 'RELEASED'; save(); },
    order: oid => db.orders.find(o => o.id === oid),
    myOrders: () => db.orders.filter(o => o.buyer === db.me && o.status !== 'PENDING'),
    mySales: () => db.orders.filter(o => { const p = find(o.lid); return p && p.sellerId === db.me && o.status !== 'PENDING'; }),
    myListings: () => db.listings.filter(l => l.sellerId === db.me),
    // Ajusta el encabezado del home según la sesión
    header(base) {
      const u = me(), reg = document.querySelector('a.icon-btn.desktop-only'), sell = document.querySelector('a.btn-sell'),
            dot = document.querySelector('.cart-dot'), cart = dot && dot.parentElement;
      if (u) {
        reg.href = base + 'cuenta/dashboard.html'; reg.querySelector('.lbl-text').textContent = u.name.split(' ')[0];
        sell.href = base + 'cuenta/publicar.html'; cart.href = base + 'cuenta/carrito.html';
        this.refreshCartBadge();
      } else { this.refreshCartBadge(); }
    }
  };
})();


// Mantiene sincronizado el contador del carrito en todas las páginas.
window.addEventListener('mns:cart-updated', () => MNS.refreshCartBadge());
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => MNS.refreshCartBadge());
else MNS.refreshCartBadge();
