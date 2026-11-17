/* ============================================================
   Mercado Norte Sur — Conexión con Firebase
   Auth (Google + correo) · Firestore · Storage

   Se importa como módulo ES desde cada página:
     <script type="module"> import { ... } from "../assets/firebase.js"; </script>

   Nota: los módulos ES no cargan abriendo el HTML con doble clic (file://).
   Para probar en local usar Live Server; en GitHub Pages funciona normal.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection,
  query, where, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";

// Esta configuración es pública por diseño (no es una clave secreta).
// Lo que protege los datos son las reglas de seguridad (ver /firebase/*.rules).
const firebaseConfig = {
  apiKey: "AIzaSyBUFIRvyBoPdlWMBMaCCtOATFUX5TGRTcU",
  authDomain: "mercadonortesur.firebaseapp.com",
  projectId: "mercadonortesur",
  storageBucket: "mercadonortesur.firebasestorage.app",
  messagingSenderId: "738979961235",
  appId: "1:738979961235:web:1b53ec0ca13a3c40a0b066",
  measurementId: "G-JLVCE57VPM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
auth.languageCode = "es";

// Analytics solo si el navegador lo soporta (no rompe nada si falla)
isSupported().then(ok => { if (ok) getAnalytics(app); }).catch(() => {});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/* ---------- Utilidades ---------- */

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function safeUrl(u) {
  return typeof u === "string" && /^https:\/\//i.test(u) ? u : "";
}

// Normaliza formatos históricos de imágenes y resuelve rutas de Firebase Storage.
// Admite arrays de URL, objetos {url/src/downloadURL/path} y campos heredados.
export async function resolveListingImages(listing) {
  if (!listing || typeof listing !== "object") return [];
  const candidates = [];
  for (const field of ["images", "photos", "imageUrls", "pictures"]) {
    if (Array.isArray(listing[field])) candidates.push(...listing[field]);
  }
  for (const field of ["imageUrl", "image", "photo", "thumbnail"]) {
    if (listing[field]) candidates.push(listing[field]);
  }
  const resolved = await Promise.all(candidates.map(async item => {
    const value = typeof item === "string" ? item : (
      item && typeof item === "object"
        ? (item.url || item.downloadURL || item.downloadUrl || item.src || item.imageUrl || item.fullPath || item.path || "")
        : ""
    );
    if (typeof value !== "string" || !value.trim()) return "";
    const raw = value.trim();
    if (/^https:\/\//i.test(raw)) return raw;
    if (/^(gs:\/\/|listings\/)/i.test(raw)) {
      try { return await getDownloadURL(ref(storage, raw)); } catch (error) {
        console.warn("No se pudo resolver una fotografía de Storage:", raw, error);
      }
    }
    return "";
  }));
  return [...new Set(resolved.filter(Boolean))];
}

export function ms(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  return Number(ts) || 0;
}

export function friendlyError(err) {
  const map = {
    "auth/invalid-email": "El correo no es válido.",
    "auth/missing-email": "Ingresa tu correo.",
    "auth/missing-password": "Ingresa tu contraseña.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "Correo o contraseña incorrectos.",
    "auth/user-disabled": "Esta cuenta fue deshabilitada. Escríbenos para revisarla.",
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Prueba iniciando sesión.",
    "auth/weak-password": "La contraseña es muy débil (mínimo 8 caracteres).",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar.",
    "auth/cancelled-popup-request": "",
    "auth/popup-blocked": "Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.",
    "auth/network-request-failed": "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
    "auth/operation-not-allowed": "Este método de acceso no está activado en Firebase (Authentication → Sign-in method).",
    "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).",
    "permission-denied": "No tienes permiso para hacer esto. Revisa las reglas de Firestore o tu rol.",
    "unavailable": "No pudimos conectar con el servidor. Inténtalo de nuevo.",
    "storage/unauthorized": "No se pudieron subir las fotos (permisos de Storage).",
    "storage/unknown": "No se pudieron subir las fotos (¿Storage está activado en Firebase?).",
    "storage/retry-limit-exceeded": "La subida de fotos tardó demasiado. Inténtalo de nuevo."
  };
  if (err && err.code in map) return map[err.code];
  return "Ocurrió un error: " + ((err && (err.code || err.message)) || "desconocido");
}

/* ---------- Autenticación ---------- */

export async function ensureUserDoc(user, extra = {}) {
  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);
  if (snap.exists()) {
    const profile = snap.data();
    // Activar automáticamente cuentas antiguas que quedaron pendientes.
    // No altera cuentas suspendidas/rechazadas ni perfiles administradores.
    if (profile.role === "user" && profile.status === "pending") {
      await updateDoc(refDoc, { status: "approved", reviewedAt: serverTimestamp() });
      return { ...profile, status: "approved" };
    }
    return profile;
  }
  const data = {
    name: extra.name || user.displayName || (user.email || "").split("@")[0] || "Usuario",
    email: user.email || "",
    photoURL: user.photoURL || "",
    provider: (user.providerData && user.providerData[0] && user.providerData[0].providerId) || "password",
    role: "user",
    status: "approved",
    createdAt: serverTimestamp()
  };
  await setDoc(refDoc, data);
  return { ...data, createdAt: null };
}

export async function registerWithEmail(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  const profile = await ensureUserDoc(cred.user, { name });
  return { user: cred.user, profile };
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await ensureUserDoc(cred.user);
  return { user: cred.user, profile };
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const profile = await ensureUserDoc(cred.user);
  return { user: cred.user, profile };
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function logout() {
  return signOut(auth);
}

// cb(user, profile, error). Si no hay sesión: cb(null, null).
export function watchUser(cb) {
  return onAuthStateChanged(auth, async user => {
    if (!user) return cb(null, null);
    try {
      const profile = await ensureUserDoc(user);
      cb(user, profile);
    } catch (e) {
      console.error(e);
      cb(user, null, e);
    }
  });
}

export function homeFor(profile) {
  return profile && profile.role === "admin" ? "../admin/dashboard.html" : "../cuenta/dashboard.html";
}

/* ---------- Publicaciones ---------- */

function mapDocs(snap) {
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchApprovedListings() {
  const snap = await getDocs(query(collection(db, "listings"), where("status", "==", "approved")));
  return mapDocs(snap).sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
}

export async function fetchMyListings(uid) {
  const snap = await getDocs(query(collection(db, "listings"), where("sellerId", "==", uid)));
  return mapDocs(snap).sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
}

export async function fetchListing(id) {
  const snap = await getDoc(doc(db, "listings", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Procesa las imágenes para respetar el límite de Firebase Storage (3 MB).
async function resizeImage(file, maxSide = 1200) {
  let source, bitmap = null;
  if (typeof createImageBitmap === "function") { try { bitmap = await createImageBitmap(file); source = bitmap; } catch (_) {} }
  if (!source) {
    source = await new Promise((resolve, reject) => {
      const image = new Image(), url = URL.createObjectURL(file);
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No pudimos leer una de las imágenes. Usa JPG, PNG o WEBP.")); };
      image.src = url;
    });
  }
  let side = maxSide;
  try {
    for (let attempt = 0; attempt < 7; attempt++) {
      const scale = Math.min(1, side / Math.max(source.width, source.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(source.width * scale));
      canvas.height = Math.max(1, Math.round(source.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No pudimos procesar la imagen en este navegador.");
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42]) {
        const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("No se pudo procesar la imagen")), "image/jpeg", quality));
        if (blob.size <= 2.5 * 1024 * 1024) return blob;
      }
      side = Math.round(side * 0.78);
    }
    throw new Error("La imagen es demasiado grande para subirla. Prueba con otra foto.");
  } finally { if (bitmap && typeof bitmap.close === "function") bitmap.close(); }
}

// Subida tolerante a fallos: valida cada archivo, limita peso y reintenta errores transitorios.
export async function uploadListingImages(uid, files) {
  if (!uid) throw new Error("Inicia sesión para subir fotografías.");
  if (!Array.isArray(files) || !files.length) return [];

  // El formulario admite hasta 4 fotos: procesarlas y subirlas en paralelo
  // reduce la espera frente a la subida secuencial.
  const tasks = files.map(async (file, index) => {
    const mime = String(file?.type || "").toLowerCase();
    const filename = String(file?.name || "").toLowerCase();
    if (!file || (!["image/jpeg", "image/png"].includes(mime) && !/\\.(jpe?g|png)$/.test(filename))) {
      throw new Error("Solo puedes subir fotografías JPG, JPEG o PNG.");
    }
    const blob = await resizeImage(file);
    if (blob.size >= 3 * 1024 * 1024) {
      throw new Error("Una fotografía supera el límite permitido. Prueba con otra imagen.");
    }
    const unique = (globalThis.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    const storageRef = ref(storage, "listings/" + uid + "/" + unique + "-" + index + ".jpg");

    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await uploadBytes(storageRef, blob, {
          contentType: "image/jpeg",
          cacheControl: "public,max-age=31536000"
        });
        const url = await getDownloadURL(storageRef);
        if (!/^https:\/\//i.test(url)) {
          throw new Error("Firebase no devolvió una dirección válida para la fotografía.");
        }
        return url;
      } catch (err) {
        lastError = err;
        if (attempt < 2 && ["storage/retry-limit-exceeded","storage/unknown","unavailable","deadline-exceeded"].includes(err?.code)) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        } else {
          break;
        }
      }
    }
    throw lastError || new Error("No se pudo subir una fotografía.");
  });

  // Promise.all mantiene el orden original de las fotos.
  return Promise.all(tasks);
}

function listingPayload(f) {
  return {
    title: f.title.trim(),
    category: f.category,
    condition: f.condition,
    description: (f.description || "").trim(),
    price: Number(f.price),
    oldPrice: f.oldPrice ? Number(f.oldPrice) : null,
    unit: f.unit || "",
    location: (f.location || "").trim(),
    contactPhone: (f.contactPhone || "").replace(/\D/g, "").replace(/^9(?=\d{8}$)/, "569")
  };
}

export async function createListing(form, images, user, profile, listingId = null) {
  const isAdmin = !!(user && profile && profile.role === "admin");
  if (!user || !profile || (!isAdmin && profile.status !== "approved")) {
    throw new Error("Tu cuenta debe estar habilitada para publicar.");
  }
  const listingRef = listingId
    ? doc(db, "listings", listingId)
    : doc(collection(db, "listings"));

  // Las publicaciones de usuarios entran a revisión. Las del administrador
  // quedan publicadas inmediatamente y se identifican como institucionales.
  const data = {
    ...listingPayload(form),
    images: images || [],
    sellerId: user.uid,
    sellerName: isAdmin ? "Mercado Norte Sur" : (profile.name || user.displayName || (user.email || "").split("@")[0] || "Usuario"),
    ...(isAdmin ? { sellerType: "admin", adminCatalog: true } : {}),
    status: isAdmin ? "approved" : "pending",
    rejectionReason: null,
    createdAt: serverTimestamp(),
    reviewedAt: isAdmin ? serverTimestamp() : null
  };
  await setDoc(listingRef, data);
  return listingRef.id;
}

// Adjunta fotos después de crear la publicación. Si Storage falla, el anuncio
// ya existe en Firestore y no se pierde el formulario ni el registro.
export async function updateListingImages(id, images) {
  await updateDoc(doc(db, "listings", id), { images: images || [] });
}

// Las ediciones de usuarios vuelven a revisión; las del administrador siguen publicadas.
export async function resubmitListing(id, form, images, user = null, profile = null) {
  const isAdmin = !!(user && profile && profile.role === "admin");
  const data = {
    ...listingPayload(form),
    status: isAdmin ? "approved" : "pending",
    rejectionReason: null,
    reviewedAt: isAdmin ? serverTimestamp() : null
  };
  if (Array.isArray(images)) data.images = images;
  await updateDoc(doc(db, "listings", id), data);
}

export function removeListing(id) {
  return deleteDoc(doc(db, "listings", id));
}

/* ---------- Administración (requiere role = "admin") ---------- */

// Importación idempotente del catálogo institucional. Solo puede ejecutarla un administrador.
export async function importAdminCatalog(items, user, profile) {
  if (!user || !profile || profile.role !== "admin") throw new Error("Solo un administrador puede cargar el catálogo institucional.");
  let created = 0, skipped = 0;
  for (const item of items) {
    const listingRef = doc(db, "listings", item.id);
    const existing = await getDoc(listingRef);
    if (existing.exists()) { skipped++; continue; }
    await setDoc(listingRef, {
      title: item.title,
      category: item.category,
      condition: item.condition,
      description: item.description,
      price: Number(item.price),
      oldPrice: item.oldPrice == null ? null : Number(item.oldPrice),
      unit: item.unit || "",
      location: item.location || "",
      images: item.image ? [item.image] : [],
      attributes: item.attributes || {},
      contactPhone: String(profile.contactPhone || profile.whatsapp || profile.phone || "").replace(/\D/g, ""),
      sellerId: user.uid,
      sellerName: "Mercado Norte Sur",
      sellerType: "admin",
      adminCatalog: true,
      status: "pending",
      rejectionReason: null,
      createdAt: serverTimestamp(),
      reviewedAt: null
    });
    await updateDoc(listingRef, { status: "approved", reviewedAt: serverTimestamp() });
    created++;
  }
  return { created, skipped, total: items.length };
}

// Actualiza el WhatsApp institucional y las publicaciones que pertenecen a la cuenta admin.
export async function setAdminContactPhone(uid, phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) throw new Error("Ingresa un WhatsApp con código de país válido (por ejemplo, +56 9 1234 5678).");
  await updateDoc(doc(db, "users", uid), { contactPhone: digits });
  const own = await getDocs(query(collection(db, "listings"), where("sellerId", "==", uid)));
  for (const item of own.docs) {
    if (item.data().sellerType === "admin" || item.data().adminCatalog) {
      await updateDoc(item.ref, { contactPhone: digits });
    }
  }
  return digits;
}

export async function fetchAllListings() {
  return mapDocs(await getDocs(collection(db, "listings")));
}

export async function fetchAllUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// markReviewed=true solo al aprobar/rechazar desde la cola (para medir tiempo de revisión)
export function setListingStatus(id, status, { reason = null, markReviewed = false } = {}) {
  const data = { status, rejectionReason: status === "rejected" ? reason : null };
  if (markReviewed) data.reviewedAt = serverTimestamp();
  return updateDoc(doc(db, "listings", id), data);
}

export function setUserStatus(uid, status) {
  return updateDoc(doc(db, "users", uid), { status, reviewedAt: serverTimestamp() });
}


/* ---------- Favoritos ---------- */
export async function fetchFavoriteIds(uid) {
  if (!uid) return [];
  const snap = await getDocs(collection(db, "users", uid, "favorites"));
  return snap.docs.map(d => d.id);
}
export async function toggleFavorite(uid, listingId) {
  if (!uid) throw new Error("Inicia sesión para guardar favoritos.");
  const favoriteRef = doc(db, "users", uid, "favorites", listingId);
  const snap = await getDoc(favoriteRef);
  if (snap.exists()) { await deleteDoc(favoriteRef); return false; }
  await setDoc(favoriteRef, { listingId, createdAt: serverTimestamp() });
  return true;
}
export async function fetchFavoriteListings(uid) {
  const ids = await fetchFavoriteIds(uid);
  const listings = await Promise.all(ids.map(id => fetchListing(id).catch(() => null)));
  return listings.filter(item => item && item.status === "approved");
}
