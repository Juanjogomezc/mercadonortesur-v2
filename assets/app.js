/* Mercado Norte Sur — utilidades del carrito local.
   Las cuentas, publicaciones, favoritos y moderación viven en Firebase. */
const MNS = (() => {
  const CART_KEY = "mns_cart";
  const readCart = () => {
    try {
      const value = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (e) { return []; }
  };
  const writeCart = items => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {}
    window.dispatchEvent(new Event("mns:cart-updated"));
  };
  const cartCount = () => readCart().reduce((sum, item) => sum + Math.max(1, Number(item.qty) || 1), 0);
  const refreshCartBadge = () => {
    const count = cartCount();
    document.querySelectorAll(".cart-dot").forEach(dot => {
      dot.textContent = count;
      dot.style.display = count ? "" : "none";
    });
    document.querySelectorAll("[data-cart-link]").forEach(link => {
      link.href = (link.dataset.cartBase || "") + "cuenta/carrito.html";
    });
    return count;
  };
  return {
    getCart: readCart,
    cartCount,
    refreshCartBadge,
    addToCart(product) {
      if (!product || !product.id) return false;
      const items = readCart();
      const existing = items.find(item => item.id === product.id);
      if (existing) existing.qty = Math.min(99, (Number(existing.qty) || 1) + 1);
      else items.push({
        id: String(product.id),
        qty: 1,
        snapshot: {
          name: product.name || product.title || "Producto",
          price: Number(product.price) || 0,
          image: product.image || product.img || (Array.isArray(product.images) ? product.images[0] : ""),
          seller: product.seller || product.sellerName || "Vendedor",
          category: product.category || product.cat || "",
          location: product.location || product.loc || ""
        }
      });
      writeCart(items);
      return true;
    },
    updateCartQuantity(id, qty) {
      const items = readCart(), item = items.find(row => row.id === id);
      if (!item) return;
      const amount = Math.floor(Number(qty));
      if (!Number.isFinite(amount) || amount < 1) return this.removeFromCart(id);
      item.qty = Math.min(99, amount);
      writeCart(items);
    },
    removeFromCart(id) { writeCart(readCart().filter(item => item.id !== id)); },
    clearCart() { writeCart([]); }
  };
})();
window.addEventListener("mns:cart-updated", () => MNS.refreshCartBadge());
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => MNS.refreshCartBadge());
else MNS.refreshCartBadge();
