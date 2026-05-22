import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

const normalizeProduct = (p) => ({
  id: p._id || p.id,
  _id: p._id || p.id,
  name: p.name,
  category: p.category?.slug || p.category || "all",
  price: p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price,
  originalPrice: p.price,
  rating: p.ratings || p.rating || 4.8,
  reviews: p.numReviews || p.reviews || 0,
  badge: p.badge || (p.isBestSeller ? "bestseller" : null),
  img: p.images?.[0]?.url || p.img || (p.category?.emoji || "🍕"),
  desc: p.shortDesc || p.description || p.desc || "Fresh and delicious item",
  tags: p.tags || [p.isVeg === false ? "non-veg" : "veg"],
});

// ─── DATA ───────────────────────────────────────────────────────────────────

const PRODUCTS = [
  { id: 1, name: "Margherita Classic", category: "pizza", price: 249, rating: 4.8, reviews: 324, badge: "bestseller", img: "🍕", desc: "Fresh mozzarella, tomato basil sauce, olive oil drizzle", tags: ["veg"] },
  { id: 2, name: "Chicken Supreme", category: "pizza", price: 349, rating: 4.9, reviews: 512, badge: "hot", img: "🍕", desc: "Grilled chicken, bell peppers, onions, jalapeños", tags: ["non-veg"] },
  { id: 3, name: "Chocolate Fantasy Cake", category: "cake", price: 599, rating: 5.0, reviews: 198, badge: "premium", img: "🎂", desc: "Rich dark chocolate layers with ganache frosting", tags: ["veg"] },
  { id: 4, name: "Black Forest Delight", category: "cake", price: 699, rating: 4.7, reviews: 267, badge: null, img: "🎂", desc: "Cherries, cream, chocolate shavings, kirsch-soaked layers", tags: ["veg"] },
  { id: 5, name: "Red Velvet Dream", category: "cake", price: 649, rating: 4.9, reviews: 189, badge: "trending", img: "🎂", desc: "Velvety smooth red cake with cream cheese frosting", tags: ["veg"] },
  { id: 6, name: "Butter Croissant", category: "pastry", price: 89, rating: 4.6, reviews: 445, badge: null, img: "🥐", desc: "Flaky, golden-baked French croissant with real butter", tags: ["veg"] },
  { id: 7, name: "Puff Pastry Set", category: "pastry", price: 149, rating: 4.5, reviews: 234, badge: null, img: "🥐", desc: "Assorted sweet & savory puffs, 6-piece box", tags: ["veg"] },
  { id: 8, name: "Cheese Burst Nachos", category: "snacks", price: 179, rating: 4.7, reviews: 378, badge: "spicy", img: "🧀", desc: "Crispy nachos loaded with molten cheese and salsa", tags: ["veg"] },
  { id: 9, name: "Chicken Momo Basket", category: "snacks", price: 199, rating: 4.8, reviews: 502, badge: "hot", img: "🥟", desc: "Steamed chicken dumplings with spicy chutney dip", tags: ["non-veg"] },
  { id: 10, name: "Mango Smoothie", category: "drinks", price: 129, rating: 4.6, reviews: 267, badge: null, img: "🥭", desc: "Fresh Alphonso mango blended with yogurt & honey", tags: ["veg"] },
  { id: 11, name: "Oreo Choco Shake", category: "drinks", price: 149, rating: 4.8, reviews: 445, badge: "loved", img: "🥤", desc: "Creamy Oreo milkshake topped with whipped cream", tags: ["veg"] },
  { id: 12, name: "Unicorn Birthday Cake", category: "birthday", price: 999, rating: 5.0, reviews: 156, badge: "special", img: "🦄", desc: "Rainbow unicorn theme with edible glitter & fondant", tags: ["veg"] },
  { id: 13, name: "Anniversary Rose Cake", category: "anniversary", price: 1199, rating: 4.9, reviews: 89, badge: "premium", img: "🌹", desc: "Elegant rose floral design, two tiers, pastel palette", tags: ["veg"] },
  { id: 14, name: "Kids Cartoon Cake", category: "kids", price: 799, rating: 4.9, reviews: 134, badge: null, img: "🧸", desc: "Custom cartoon character design for your little one", tags: ["veg"] },
  { id: 15, name: "Pepperoni Feast", category: "pizza", price: 399, rating: 4.8, reviews: 623, badge: "bestseller", img: "🍕", desc: "Double pepperoni, mozzarella, herb-infused tomato sauce", tags: ["non-veg"] },
  { id: 16, name: "Butterscotch Cake", category: "cake", price: 549, rating: 4.7, reviews: 212, badge: null, img: "🎂", desc: "Caramel butterscotch layers with crunchy praline topping", tags: ["veg"] },
];

const CATEGORIES = ["all", "pizza", "cake", "pastry", "snacks", "drinks", "birthday", "anniversary", "kids"];

const CAKE_TYPES = [
  { name: "Chocolate Cakes", icon: "🍫", color: "#7B3F00" },
  { name: "Black Forest", icon: "🍒", color: "#1a1a2e" },
  { name: "Red Velvet", icon: "❤️", color: "#8B0000" },
  { name: "Butterscotch", icon: "🍯", color: "#c8860a" },
  { name: "Fruit Cakes", icon: "🍓", color: "#e63946" },
  { name: "Photo Cakes", icon: "📸", color: "#457b9d" },
  { name: "Wedding Cakes", icon: "💍", color: "#f4a261" },
  { name: "Theme Cakes", icon: "🎨", color: "#6a4c93" },
  { name: "Cartoon Cakes", icon: "🦸", color: "#f77f00" },
  { name: "Designer Cakes", icon: "✨", color: "#023047" },
];

const DECORATIONS = [
  { name: "Birthday Decoration", icon: "🎂", price: "₹1,999 onwards", desc: "Full room setup with balloons, banners & lights" },
  { name: "Anniversary Decoration", icon: "💑", price: "₹2,499 onwards", desc: "Romantic setup with flowers, candles & streamers" },
  { name: "Baby Shower", icon: "👶", price: "₹1,799 onwards", desc: "Pastel-themed setup with cute props & backdrop" },
  { name: "Balloon Decoration", icon: "🎈", price: "₹999 onwards", desc: "Custom balloon arches, pillars & bouquets" },
  { name: "Wedding Decoration", icon: "💒", price: "₹4,999 onwards", desc: "Grand floral mandap, entry arch & stage setup" },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", city: "Jaipur", text: "The birthday cake was absolutely stunning! Everyone at the party couldn't stop complimenting it. Will definitely order again!", rating: 5, avatar: "PS" },
  { name: "Rahul Mehta", city: "Udaipur", text: "Their Pepperoni Feast pizza is hands down the best I've had outside of Italy. Fast delivery too!", rating: 5, avatar: "RM" },
  { name: "Anjali Singh", city: "Jodhpur", text: "Ordered a custom wedding cake and it exceeded all expectations. The design was pixel-perfect!", rating: 5, avatar: "AS" },
  { name: "Vikram Patel", city: "Jaipur", text: "The party decoration team transformed our hall completely. Very professional and on-time service.", rating: 5, avatar: "VP" },
];

const ADMIN_ORDERS = [
  { id: "#ORD001", customer: "Priya S.", item: "Chocolate Fantasy Cake", amount: 599, status: "delivered", date: "10 May" },
  { id: "#ORD002", customer: "Rahul M.", item: "Chicken Supreme Pizza", amount: 349, status: "preparing", date: "10 May" },
  { id: "#ORD003", customer: "Anjali S.", item: "Wedding Cake (Custom)", amount: 3200, status: "confirmed", date: "09 May" },
  { id: "#ORD004", customer: "Vikram P.", item: "Party Decoration", amount: 2499, status: "pending", date: "09 May" },
  { id: "#ORD005", customer: "Meera K.", item: "Red Velvet Dream", amount: 649, status: "out_for_delivery", date: "08 May" },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

const BADGE_COLORS = {
  bestseller: "#e07b00",
  hot: "#e63946",
  premium: "#6a4c93",
  trending: "#2196f3",
  spicy: "#ff5722",
  loved: "#e91e63",
  special: "#009688",
};

const STATUS_COLORS = {
  delivered: "#4caf50",
  preparing: "#ff9800",
  confirmed: "#2196f3",
  pending: "#9e9e9e",
  out_for_delivery: "#e91e63",
};

const formatPrice = (p) => `₹${p}`;

const StarRow = ({ rating }) => (
  <span style={{ color: "#f4b400", fontSize: 13, letterSpacing: 1 }}>
    {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
  </span>
);

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function ProductCard({ product, onAddToCart, onQuickView, wishlist, onToggleWish }) {
  const [qty, setQty] = useState(1);
  const inWish = wishlist.includes(product.id);
  return (
    <div style={{
      background: "rgba(255,255,255,0.97)",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(180,80,20,0.10)",
      transition: "transform 0.22s, box-shadow 0.22s",
      position: "relative",
      cursor: "pointer",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(180,80,20,0.18)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(180,80,20,0.10)"; }}
    >
      {product.badge && (
        <span style={{
          position: "absolute", top: 12, left: 12, zIndex: 2,
          background: BADGE_COLORS[product.badge] || "#e07b00",
          color: "#fff", fontSize: 11, fontWeight: 700,
          padding: "3px 10px", borderRadius: 20, textTransform: "uppercase",
          letterSpacing: 0.8,
        }}>{product.badge}</span>
      )}
      <button onClick={() => onToggleWish(product.id)} style={{
        position: "absolute", top: 12, right: 12, zIndex: 2, background: "white",
        border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
        fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }}>{inWish ? "❤️" : "🤍"}</button>
      <div style={{
        height: 140, background: "linear-gradient(135deg, #fef3e2 0%, #ffe0b2 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64,
      }} onClick={() => onQuickView(product)}>
        {String(product.img).startsWith("http") ? <img src={product.img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : product.img}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#2d1b00", fontFamily: "'Georgia', serif" }}>{product.name}</span>
        </div>
        <p style={{ fontSize: 12, color: "#7a5c3a", margin: "0 0 8px", lineHeight: 1.5 }}>{product.desc}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <StarRow rating={product.rating} />
          <span style={{ fontSize: 11, color: "#aaa" }}>({product.reviews})</span>
          {product.tags.map(t => (
            <span key={t} style={{
              fontSize: 10, padding: "2px 7px", borderRadius: 10,
              background: t === "veg" ? "#e8f5e9" : "#fce4ec",
              color: t === "veg" ? "#2e7d32" : "#c62828", fontWeight: 600,
            }}>{t === "veg" ? "🟢 Veg" : "🔴 Non-veg"}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 19, fontWeight: 800, color: "#c8430a" }}>{formatPrice(product.price)}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#fff3e0", borderRadius: 20, overflow: "hidden" }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 10px", fontSize: 16, color: "#c8430a", fontWeight: 700 }}>−</button>
              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center", color: "#2d1b00" }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 10px", fontSize: 16, color: "#c8430a", fontWeight: 700 }}>+</button>
            </div>
            <button onClick={() => onAddToCart(product, qty)} style={{
              background: "linear-gradient(135deg, #e07b00, #c8430a)",
              color: "#fff", border: "none", borderRadius: 20, padding: "7px 14px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 3px 10px rgba(200,67,10,0.28)",
              transition: "transform 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.07)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >Add 🛒</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickViewModal({ product, onClose, onAddToCart }) {
  if (!product) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 24, maxWidth: 440, width: "100%",
        overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        animation: "fadeUp 0.25s ease",
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          height: 200, background: "linear-gradient(135deg, #fef3e2, #ffe0b2)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 88,
          position: "relative",
        }}>
          {String(product.img).startsWith("http") ? <img src={product.img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : product.img}
          <button onClick={onClose} style={{
            position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.25)",
            border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
            fontSize: 18, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 8px", fontFamily: "'Georgia', serif", fontSize: 22, color: "#2d1b00" }}>{product.name}</h2>
          <p style={{ margin: "0 0 12px", color: "#7a5c3a", lineHeight: 1.6 }}>{product.desc}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <StarRow rating={product.rating} />
            <span style={{ fontSize: 13, color: "#aaa" }}>{product.reviews} reviews</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#c8430a" }}>{formatPrice(product.price)}</span>
            <button onClick={() => { onAddToCart(product, 1); onClose(); }} style={{
              background: "linear-gradient(135deg, #e07b00, #c8430a)",
              color: "#fff", border: "none", borderRadius: 24, padding: "10px 28px",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}>Add to Cart 🛒</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE COMPONENTS ─────────────────────────────────────────────────────────

function HomePage({ onNavigate, products, onAddToCart, wishlist, onToggleWish, onQuickView }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const featured = products.filter(p => p.badge).slice(0, 6);

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide(s => (s + 1) % featured.length), 3200);
    return () => clearInterval(t);
  }, [featured.length]);

  return (
    <div>
      {/* Hero */}
      <section style={{
        minHeight: "90vh", background: "linear-gradient(135deg, #fff8f0 0%, #ffe4c4 40%, #ffd0a0 100%)",
        display: "flex", alignItems: "center", padding: "60px 24px 40px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
        }}>
          {["🍕", "🎂", "🥐", "🍩", "🧁", "🍫", "🎈", "✨"].map((e, i) => (
            <span key={i} style={{
              position: "absolute",
              top: `${10 + i * 11}%`, left: `${5 + i * 12}%`,
              fontSize: `${24 + i * 4}px`, opacity: 0.15,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.3}s`,
            }}>{e}</span>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 40 }}>
          <div style={{ flex: "1 1 400px", zIndex: 1 }}>
            <div style={{
              display: "inline-block", background: "rgba(200,67,10,0.12)",
              color: "#c8430a", padding: "6px 16px", borderRadius: 20,
              fontSize: 13, fontWeight: 700, marginBottom: 20, letterSpacing: 0.8,
            }}>🔥 FREE DELIVERY ON ORDERS ABOVE ₹499</div>
            <h1 style={{
              fontFamily: "'Georgia', serif",
              fontSize: "clamp(32px, 5vw, 58px)",
              fontWeight: 900, lineHeight: 1.15, margin: "0 0 20px",
              color: "#2d1b00",
            }}>
              Fresh Cakes,<br />
              <span style={{
                background: "linear-gradient(135deg, #e07b00, #c8430a)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Delicious Pizza</span><br />
              & Sweet Memories
            </h1>
            <p style={{ fontSize: 17, color: "#7a5c3a", maxWidth: 460, lineHeight: 1.7, marginBottom: 32 }}>
              Handcrafted with love in Rajasthan. Every bite tells a story of freshness, flavor, and celebration.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button onClick={() => onNavigate("menu")} style={{
                background: "linear-gradient(135deg, #e07b00, #c8430a)",
                color: "#fff", border: "none", borderRadius: 28, padding: "14px 32px",
                fontSize: 16, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 6px 24px rgba(200,67,10,0.38)",
                transition: "transform 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >Order Now 🛒</button>
              <button onClick={() => onNavigate("menu")} style={{
                background: "transparent", color: "#c8430a", border: "2px solid #c8430a",
                borderRadius: 28, padding: "12px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#c8430a"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#c8430a"; }}
              >Explore Menu ✨</button>
            </div>
            <div style={{ display: "flex", gap: 32, marginTop: 40 }}>
              {[["500+", "Products"], ["4.9★", "Rating"], ["10K+", "Happy Customers"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#c8430a" }}>{v}</div>
                  <div style={{ fontSize: 12, color: "#9a7a5a" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: "1 1 280px", display: "flex", justifyContent: "center", zIndex: 1 }}>
            <div style={{
              width: 300, height: 300, borderRadius: "50%",
              background: "linear-gradient(135deg, #ffe0b2, #ffb74d)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 140, boxShadow: "0 20px 60px rgba(180,80,20,0.22)",
              animation: "pulse 3s ease-in-out infinite",
              position: "relative",
            }}>
              {["🎂", "🍕", "🥐", "🧁"][currentSlide % 4]}
              <div style={{
                position: "absolute", inset: -12, borderRadius: "50%",
                border: "3px dashed rgba(200,67,10,0.22)",
                animation: "spin 20s linear infinite",
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: "60px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontFamily: "'Georgia', serif", fontSize: 36, color: "#2d1b00", marginBottom: 8 }}>
          🌟 Featured Items
        </h2>
        <p style={{ textAlign: "center", color: "#9a7a5a", marginBottom: 40 }}>Handpicked favorites from our kitchen</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
          {featured.map(p => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onQuickView={onQuickView} wishlist={wishlist} onToggleWish={onToggleWish} />
          ))}
        </div>
      </section>

      {/* Party Banner */}
      <section style={{
        margin: "0 24px 60px", borderRadius: 24, overflow: "hidden",
        background: "linear-gradient(135deg, #6a1b9a, #e91e63)",
        padding: "40px 48px", display: "flex", flexWrap: "wrap",
        alignItems: "center", justifyContent: "space-between", gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>SPECIAL SERVICE</div>
          <h2 style={{ margin: 0, fontFamily: "'Georgia', serif", fontSize: 32, color: "#fff", fontWeight: 900 }}>
            🎈 Party Decoration<br />at Your Doorstep!
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", marginTop: 10, fontSize: 15 }}>
            Transform any space into a magical celebration. Expert decorators, premium materials.
          </p>
        </div>
        <button onClick={() => onNavigate("decoration")} style={{
          background: "#fff", color: "#6a1b9a", border: "none", borderRadius: 28,
          padding: "14px 32px", fontSize: 16, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
        }}>Book Now →</button>
      </section>

      {/* Testimonials */}
      <section style={{ padding: "60px 24px", background: "#fff8f0", maxWidth: "100%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontFamily: "'Georgia', serif", fontSize: 36, color: "#2d1b00", marginBottom: 8 }}>
            💬 What Our Customers Say
          </h2>
          <p style={{ textAlign: "center", color: "#9a7a5a", marginBottom: 40 }}>Real stories from our happy family</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 20, padding: "24px",
                boxShadow: "0 4px 20px rgba(180,80,20,0.08)",
              }}>
                <div style={{ fontSize: 22, marginBottom: 12 }}>{"★".repeat(t.rating)}</div>
                <p style={{ color: "#5a3c1a", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 16px" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: "linear-gradient(135deg, #e07b00, #c8430a)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: 14,
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#2d1b00", fontSize: 14 }}>{t.name}</div>
                    <div style={{ color: "#9a7a5a", fontSize: 12 }}>{t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MenuPage({ products, onAddToCart, wishlist, onToggleWish, onQuickView }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");

  let filtered = products.filter(p => {
    if (activeCategory !== "all" && p.category !== activeCategory) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (sortBy === "price_asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sortBy === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (sortBy === "rating") filtered = [...filtered].sort((a, b) => b.rating - a.rating);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 40, color: "#2d1b00", marginBottom: 8 }}>🍽️ Our Menu</h1>
      <p style={{ color: "#9a7a5a", marginBottom: 32 }}>Explore over 500+ handcrafted delicacies</p>

      {/* Search + Sort */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <input
          placeholder="🔍 Search items..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: "1 1 260px", padding: "12px 20px", borderRadius: 28,
            border: "2px solid #ffe0b2", fontSize: 15, outline: "none",
            background: "#fff",
          }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: "12px 20px", borderRadius: 28, border: "2px solid #ffe0b2",
            fontSize: 14, background: "#fff", color: "#2d1b00", cursor: "pointer",
          }}
        >
          <option value="popular">Sort: Popular</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Rating</option>
        </select>
      </div>

      {/* Categories */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: "9px 20px", borderRadius: 24, border: "none", cursor: "pointer",
            background: activeCategory === cat ? "linear-gradient(135deg, #e07b00, #c8430a)" : "#fff3e0",
            color: activeCategory === cat ? "#fff" : "#c8430a",
            fontWeight: 700, fontSize: 13, transition: "all 0.2s", textTransform: "capitalize",
            boxShadow: activeCategory === cat ? "0 3px 12px rgba(200,67,10,0.28)" : "none",
          }}>{cat === "all" ? "All Items" : cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#9a7a5a", fontSize: 18 }}>
          😔 No items found. Try a different search.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onQuickView={onQuickView} wishlist={wishlist} onToggleWish={onToggleWish} />
          ))}
        </div>
      )}
    </div>
  );
}

function CakesPage({ products, onAddToCart, wishlist, onToggleWish, onQuickView }) {
  const [selectedType, setSelectedType] = useState(null);
  const cakes = products.filter(p => ["cake", "birthday", "anniversary", "kids"].includes(p.category));
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 40, color: "#2d1b00", marginBottom: 8 }}>🎂 Our Cakes</h1>
      <p style={{ color: "#9a7a5a", marginBottom: 40 }}>Each cake is a masterpiece crafted with passion</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 48 }}>
        {CAKE_TYPES.map(ct => (
          <button key={ct.name} onClick={() => setSelectedType(selectedType === ct.name ? null : ct.name)} style={{
            background: selectedType === ct.name ? ct.color : "#fff",
            color: selectedType === ct.name ? "#fff" : "#2d1b00",
            border: `2px solid ${ct.color}`,
            borderRadius: 16, padding: "16px 12px", cursor: "pointer",
            textAlign: "center", transition: "all 0.2s",
            boxShadow: selectedType === ct.name ? `0 6px 20px ${ct.color}44` : "none",
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{ct.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{ct.name}</div>
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
        {cakes.map(p => (
          <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onQuickView={onQuickView} wishlist={wishlist} onToggleWish={onToggleWish} />
        ))}
      </div>
    </div>
  );
}

function CustomCakePage({ addToast }) {
  const [form, setForm] = useState({
    name: "", phone: "", flavor: "chocolate", weight: "1", text: "", date: "", instructions: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.phone || !form.date) {
      addToast("Please fill all required fields!", "error");
      return;
    }
    setSubmitted(true);
    addToast("Custom cake order placed! We'll contact you within 2 hours.", "success");
  };

  if (submitted) return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 80, marginBottom: 24 }}>🎊</div>
      <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 32, color: "#2d1b00", marginBottom: 12 }}>Order Confirmed!</h2>
      <p style={{ color: "#7a5c3a", lineHeight: 1.7 }}>Your custom cake order has been received. Our baker will contact you within 2 hours to confirm the design details.</p>
      <button onClick={() => setSubmitted(false)} style={{
        marginTop: 24, background: "linear-gradient(135deg, #e07b00, #c8430a)",
        color: "#fff", border: "none", borderRadius: 24, padding: "12px 32px",
        fontSize: 15, fontWeight: 700, cursor: "pointer",
      }}>Place Another Order</button>
    </div>
  );

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    border: "2px solid #ffe0b2", fontSize: 15, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 40, color: "#2d1b00", marginBottom: 8 }}>✨ Custom Cake Order</h1>
      <p style={{ color: "#9a7a5a", marginBottom: 36 }}>Design your dream cake and we'll bring it to life!</p>

      <div style={{ display: "grid", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>Your Name *</label>
            <input style={inputStyle} placeholder="Enter your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} onFocus={e => e.target.style.borderColor = "#c8430a"} onBlur={e => e.target.style.borderColor = "#ffe0b2"} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>Phone *</label>
            <input style={inputStyle} placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} onFocus={e => e.target.style.borderColor = "#c8430a"} onBlur={e => e.target.style.borderColor = "#ffe0b2"} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>Cake Flavor</label>
            <select style={{ ...inputStyle, background: "#fff" }} value={form.flavor} onChange={e => setForm({ ...form, flavor: e.target.value })}>
              <option value="chocolate">🍫 Chocolate</option>
              <option value="vanilla">🍦 Vanilla</option>
              <option value="redvelvet">❤️ Red Velvet</option>
              <option value="butterscotch">🍯 Butterscotch</option>
              <option value="blackforest">🍒 Black Forest</option>
              <option value="strawberry">🍓 Strawberry</option>
              <option value="fruit">🍊 Fruit Cake</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>Weight (kg)</label>
            <select style={{ ...inputStyle, background: "#fff" }} value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })}>
              {["0.5", "1", "1.5", "2", "2.5", "3", "4", "5"].map(w => <option key={w} value={w}>{w} kg</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>Message on Cake</label>
          <input style={inputStyle} placeholder="e.g. Happy Birthday Priya! 🎂" value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} onFocus={e => e.target.style.borderColor = "#c8430a"} onBlur={e => e.target.style.borderColor = "#ffe0b2"} />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>Delivery Date *</label>
          <input type="date" style={inputStyle} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} onFocus={e => e.target.style.borderColor = "#c8430a"} onBlur={e => e.target.style.borderColor = "#ffe0b2"} />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>Upload Reference Image</label>
          <div style={{
            border: "2px dashed #ffe0b2", borderRadius: 12, padding: "24px",
            textAlign: "center", cursor: "pointer", color: "#9a7a5a",
            transition: "border-color 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#c8430a"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#ffe0b2"}
          >
            📸 Click to upload or drag & drop<br />
            <span style={{ fontSize: 12 }}>JPG, PNG, GIF up to 10MB</span>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>Special Instructions</label>
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
            placeholder="Any special requirements, dietary restrictions, allergy info..."
            value={form.instructions}
            onChange={e => setForm({ ...form, instructions: e.target.value })}
            onFocus={e => e.target.style.borderColor = "#c8430a"}
            onBlur={e => e.target.style.borderColor = "#ffe0b2"}
          />
        </div>

        <div style={{
          background: "#fff8f0", borderRadius: 16, padding: 20,
          border: "2px solid #ffe0b2",
        }}>
          <h3 style={{ margin: "0 0 12px", color: "#2d1b00", fontSize: 16 }}>📦 Order Summary</h3>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#7a5c3a", marginBottom: 6 }}>
            <span>Base price ({form.weight}kg {form.flavor})</span>
            <span>₹{Math.round(parseFloat(form.weight) * 600)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#7a5c3a", marginBottom: 6 }}>
            <span>Design charges</span>
            <span>₹199</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#7a5c3a", marginBottom: 12 }}>
            <span>Delivery</span>
            <span style={{ color: "#4caf50" }}>FREE</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, color: "#c8430a" }}>
            <span>Estimated Total</span>
            <span>₹{Math.round(parseFloat(form.weight) * 600) + 199}</span>
          </div>
        </div>

        <button onClick={handleSubmit} style={{
          background: "linear-gradient(135deg, #e07b00, #c8430a)",
          color: "#fff", border: "none", borderRadius: 28, padding: "16px",
          fontSize: 17, fontWeight: 800, cursor: "pointer", width: "100%",
          boxShadow: "0 6px 24px rgba(200,67,10,0.32)",
          transition: "transform 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >🎂 Place Custom Order</button>
      </div>
    </div>
  );
}

function DecorationPage({ addToast }) {
  const [form, setForm] = useState({ name: "", phone: "", date: "", address: "", theme: "birthday", budget: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.phone || !form.date) { addToast("Please fill required fields!", "error"); return; }
    setSubmitted(true);
    addToast("Decoration booking confirmed! Team will call within 1 hour.", "success");
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 40, color: "#2d1b00", marginBottom: 8 }}>🎈 Party Decoration</h1>
      <p style={{ color: "#9a7a5a", marginBottom: 40 }}>Let us transform your space into an unforgettable celebration!</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20, marginBottom: 56 }}>
        {DECORATIONS.map(d => (
          <div key={d.name} style={{
            background: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
            borderRadius: 20, padding: "24px 16px", textAlign: "center",
            boxShadow: "0 4px 20px rgba(180,80,20,0.10)",
            transition: "transform 0.22s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>{d.icon}</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#2d1b00", fontFamily: "'Georgia', serif" }}>{d.name}</h3>
            <p style={{ fontSize: 12, color: "#7a5c3a", margin: "0 0 10px", lineHeight: 1.5 }}>{d.desc}</p>
            <div style={{ fontWeight: 800, color: "#c8430a", fontSize: 14 }}>{d.price}</div>
          </div>
        ))}
      </div>

      {submitted ? (
        <div style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎊</div>
          <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 28, color: "#2d1b00" }}>Booking Confirmed!</h2>
          <p style={{ color: "#7a5c3a" }}>Our team will contact you within 1 hour.</p>
          <button onClick={() => setSubmitted(false)} style={{ marginTop: 20, background: "linear-gradient(135deg, #e07b00, #c8430a)", color: "#fff", border: "none", borderRadius: 24, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Book Another</button>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 24, padding: "32px", boxShadow: "0 8px 32px rgba(180,80,20,0.10)" }}>
          <h2 style={{ margin: "0 0 24px", fontFamily: "'Georgia', serif", fontSize: 24, color: "#2d1b00" }}>📋 Book Your Decoration</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {[["Name *", "name", "text", "Your full name"], ["Phone *", "phone", "text", "+91 98765 43210"], ["Event Date *", "date", "date", ""], ["Address", "address", "text", "Full address"], ["Budget (₹)", "budget", "number", "5000"]].map(([label, key, type, ph]) => (
              <div key={key}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>{label}</label>
                <input type={type} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #ffe0b2", fontSize: 15, outline: "none", boxSizing: "border-box" }} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} onFocus={e => e.target.style.borderColor = "#c8430a"} onBlur={e => e.target.style.borderColor = "#ffe0b2"} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>Theme</label>
              <select style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #ffe0b2", fontSize: 15, outline: "none", boxSizing: "border-box", background: "#fff" }} value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })}>
                {DECORATIONS.map(d => <option key={d.name} value={d.name.toLowerCase().split(" ")[0]}>{d.icon} {d.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSubmit} style={{ marginTop: 28, background: "linear-gradient(135deg, #6a1b9a, #e91e63)", color: "#fff", border: "none", borderRadius: 28, padding: "15px 40px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 20px rgba(105,27,154,0.3)" }}>🎈 Confirm Booking</button>
        </div>
      )}
    </div>
  );
}

function CartPage({ cart, onUpdate, onRemove, onNavigate, addToast }) {
  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const subtotal = cart.reduce((s, item) => s + item.price * item.qty, 0);
  const gst = Math.round(subtotal * 0.05);
  const delivery = subtotal >= 499 ? 0 : 49;
  const total = subtotal + gst + delivery - couponDiscount;

  const applyCoupon = () => {
    if (coupon.toUpperCase() === "GHOCHU20") { setCouponDiscount(Math.round(subtotal * 0.2)); addToast("20% discount applied! 🎉", "success"); }
    else if (coupon.toUpperCase() === "FIRST50") { setCouponDiscount(50); addToast("₹50 flat discount applied!", "success"); }
    else addToast("Invalid coupon code", "error");
  };

  if (cart.length === 0) return (
    <div style={{ textAlign: "center", padding: "100px 24px" }}>
      <div style={{ fontSize: 88 }}>🛒</div>
      <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 28, color: "#2d1b00", marginTop: 20 }}>Your cart is empty!</h2>
      <p style={{ color: "#9a7a5a" }}>Add some delicious items to get started.</p>
      <button onClick={() => onNavigate("menu")} style={{ marginTop: 20, background: "linear-gradient(135deg, #e07b00, #c8430a)", color: "#fff", border: "none", borderRadius: 24, padding: "12px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Browse Menu</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 40, color: "#2d1b00", marginBottom: 32 }}>🛒 Your Cart</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 16 }}>
          {cart.map(item => (
            <div key={item.id} style={{
              background: "#fff", borderRadius: 20, padding: 20,
              display: "flex", alignItems: "center", gap: 16,
              boxShadow: "0 3px 16px rgba(180,80,20,0.08)",
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 16, fontSize: 40,
                background: "linear-gradient(135deg, #fef3e2, #ffe0b2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>{item.img}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#2d1b00", marginBottom: 4 }}>{item.name}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#c8430a" }}>{formatPrice(item.price)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff3e0", borderRadius: 20, padding: "4px 8px" }}>
                <button onClick={() => onUpdate(item.id, item.qty - 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#c8430a", padding: "0 4px", fontWeight: 700 }}>−</button>
                <span style={{ fontWeight: 700, fontSize: 16, minWidth: 24, textAlign: "center" }}>{item.qty}</span>
                <button onClick={() => onUpdate(item.id, item.qty + 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#c8430a", padding: "0 4px", fontWeight: 700 }}>+</button>
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#2d1b00", minWidth: 70, textAlign: "right" }}>{formatPrice(item.price * item.qty)}</div>
              <button onClick={() => onRemove(item.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#e63946", padding: 4 }}>🗑️</button>
            </div>
          ))}
          {/* Coupon */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 3px 16px rgba(180,80,20,0.08)" }}>
            <h3 style={{ margin: "0 0 14px", color: "#2d1b00", fontSize: 16 }}>🎟️ Have a Coupon?</h3>
            <div style={{ display: "flex", gap: 10 }}>
              <input placeholder="Enter code (GHOCHU20 / FIRST50)" value={coupon} onChange={e => setCoupon(e.target.value)}
                style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "2px solid #ffe0b2", fontSize: 14, outline: "none" }}
                onFocus={e => e.target.style.borderColor = "#c8430a"}
                onBlur={e => e.target.style.borderColor = "#ffe0b2"}
              />
              <button onClick={applyCoupon} style={{ background: "#c8430a", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>Apply</button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 8px 32px rgba(180,80,20,0.12)", position: "sticky", top: 100 }}>
          <h2 style={{ margin: "0 0 20px", fontFamily: "'Georgia', serif", fontSize: 22, color: "#2d1b00" }}>Order Summary</h2>
          {[["Subtotal", subtotal], ["GST (5%)", gst], ["Delivery", delivery || "FREE"], ...(couponDiscount ? [["Coupon Discount", `-₹${couponDiscount}`]] : [])].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 15, color: "#7a5c3a" }}>
              <span>{l}</span>
              <span style={{ fontWeight: 600, color: l.includes("Coupon") ? "#4caf50" : "#2d1b00" }}>{typeof v === "number" ? formatPrice(v) : v}</span>
            </div>
          ))}
          {delivery === 0 && <p style={{ fontSize: 12, color: "#4caf50", textAlign: "center", margin: "0 0 12px" }}>🎉 Free delivery on this order!</p>}
          <div style={{ borderTop: "2px solid #ffe0b2", paddingTop: 16, display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: "#c8430a", marginBottom: 24 }}>
            <span>Total</span><span>{formatPrice(total)}</span>
          </div>
          {/* Payment */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", marginBottom: 10 }}>Payment Method</p>
            {[["online", "💳 Pay Online (Razorpay)"], ["cod", "💵 Cash on Delivery"]].map(([v, l]) => (
              <label key={v} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, cursor: "pointer" }}>
                <input type="radio" name="payment" value={v} checked={paymentMethod === v} onChange={() => setPaymentMethod(v)} />
                <span style={{ fontSize: 14, color: "#2d1b00" }}>{l}</span>
              </label>
            ))}
          </div>
          <button onClick={() => { addToast(`Order placed via ${paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"}! 🎉`, "success"); }} style={{
            width: "100%", background: "linear-gradient(135deg, #e07b00, #c8430a)",
            color: "#fff", border: "none", borderRadius: 24, padding: "15px",
            fontSize: 16, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 6px 20px rgba(200,67,10,0.3)",
          }}>
            {paymentMethod === "cod" ? "Place Order (COD)" : "Proceed to Pay →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthPage({ setUser, addToast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = () => {
    if (!form.email || !form.password) { addToast("Please fill all fields!", "error"); return; }
    if (mode === "register" && !form.name) { addToast("Name is required!", "error"); return; }
    setUser({ name: form.name || form.email.split("@")[0], email: form.email, avatar: form.email[0].toUpperCase() });
    addToast(mode === "login" ? "Welcome back! 🎉" : "Account created! Welcome! 🎊", "success");
  };

  const inp = {
    width: "100%", padding: "14px 16px", borderRadius: 14, border: "2px solid #ffe0b2",
    fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 28, padding: "40px 36px", width: "100%", maxWidth: 440, boxShadow: "0 16px 60px rgba(180,80,20,0.14)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎂</div>
          <h2 style={{ margin: 0, fontFamily: "'Georgia', serif", fontSize: 28, color: "#2d1b00" }}>
            {mode === "login" ? "Welcome Back!" : "Join Ghochu Pizza"}
          </h2>
          <p style={{ color: "#9a7a5a", marginTop: 6 }}>
            {mode === "login" ? "Sign in to your account" : "Create your free account"}
          </p>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          {mode === "register" && (
            <input style={inp} placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} onFocus={e => e.target.style.borderColor = "#c8430a"} onBlur={e => e.target.style.borderColor = "#ffe0b2"} />
          )}
          <input style={inp} placeholder="Email address" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} onFocus={e => e.target.style.borderColor = "#c8430a"} onBlur={e => e.target.style.borderColor = "#ffe0b2"} />
          <input style={inp} placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onFocus={e => e.target.style.borderColor = "#c8430a"} onBlur={e => e.target.style.borderColor = "#ffe0b2"} />
          {mode === "login" && <p style={{ textAlign: "right", margin: 0, fontSize: 13, color: "#c8430a", cursor: "pointer" }}>Forgot password?</p>}
          <button onClick={handleSubmit} style={{
            background: "linear-gradient(135deg, #e07b00, #c8430a)",
            color: "#fff", border: "none", borderRadius: 24, padding: "15px",
            fontSize: 16, fontWeight: 800, cursor: "pointer", marginTop: 4,
            boxShadow: "0 6px 20px rgba(200,67,10,0.28)",
          }}>{mode === "login" ? "Sign In 🔑" : "Create Account ✨"}</button>
        </div>
        <p style={{ textAlign: "center", color: "#9a7a5a", marginTop: 24, fontSize: 14 }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: "#c8430a", fontWeight: 700, cursor: "pointer" }} onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Sign Up" : "Sign In"}
          </span>
        </p>
        <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
          {["🔵 Google", "⚫ Apple"].map(s => (
            <button key={s} style={{ flex: 1, padding: "11px", borderRadius: 14, border: "2px solid #ffe0b2", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#2d1b00" }}>{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminPage({ orders, products, addToast }) {
  const [tab, setTab] = useState("dashboard");
  const revenue = orders.reduce((s, o) => s + o.amount, 0);

  const tabs = ["dashboard", "orders", "products", "users", "analytics"];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{ fontSize: 40 }}>⚙️</div>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Georgia', serif", fontSize: 32, color: "#2d1b00" }}>Admin Dashboard</h1>
          <p style={{ margin: 0, color: "#9a7a5a" }}>Manage your bakery empire</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "9px 20px", borderRadius: 20, border: "none", cursor: "pointer",
            background: tab === t ? "linear-gradient(135deg, #e07b00, #c8430a)" : "#fff3e0",
            color: tab === t ? "#fff" : "#c8430a", fontWeight: 700, fontSize: 13,
            textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 32 }}>
            {[
              { label: "Total Revenue", value: `₹${revenue.toLocaleString()}`, icon: "💰", color: "#4caf50" },
              { label: "Total Orders", value: orders.length, icon: "📦", color: "#2196f3" },
              { label: "Products", value: products.length, icon: "🎂", color: "#e07b00" },
              { label: "Customers", value: 1240, icon: "👥", color: "#9c27b0" },
            ].map(m => (
              <div key={m.label} style={{
                background: "#fff", borderRadius: 20, padding: "24px 20px",
                boxShadow: "0 4px 20px rgba(180,80,20,0.08)",
                borderLeft: `4px solid ${m.color}`,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#2d1b00" }}>{m.value}</div>
                <div style={{ fontSize: 13, color: "#9a7a5a" }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Revenue bar */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(180,80,20,0.08)", marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 20px", color: "#2d1b00" }}>📊 Revenue (Last 7 Days)</h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
              {[40, 75, 55, 90, 65, 80, 100].map((h, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: "100%", height: `${h}%`, borderRadius: "8px 8px 0 0",
                    background: `linear-gradient(180deg, #e07b00, #c8430a)`,
                    transition: "height 0.5s ease",
                  }} />
                  <span style={{ fontSize: 11, color: "#9a7a5a" }}>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 20px rgba(180,80,20,0.08)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#fff8f0" }}>
                {["Order ID", "Customer", "Item", "Amount", "Status", "Date", "Action"].map(h => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "#7a5c3a", fontWeight: 700, fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ADMIN_ORDERS.map((o, i) => (
                <tr key={o.id} style={{ borderTop: "1px solid #fff3e0" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#c8430a" }}>{o.id}</td>
                  <td style={{ padding: "14px 16px", color: "#2d1b00" }}>{o.customer}</td>
                  <td style={{ padding: "14px 16px", color: "#5a3c1a" }}>{o.item}</td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#2d1b00" }}>₹{o.amount}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: STATUS_COLORS[o.status] + "22",
                      color: STATUS_COLORS[o.status],
                    }}>{o.status.replace(/_/g, " ")}</span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#9a7a5a" }}>{o.date}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <button onClick={() => addToast("Order updated!", "success")} style={{ background: "#fff3e0", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "#c8430a", fontWeight: 600 }}>Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "products" && (
        <div>
          <button onClick={() => addToast("Add product feature coming soon!", "success")} style={{ marginBottom: 20, background: "linear-gradient(135deg, #e07b00, #c8430a)", color: "#fff", border: "none", borderRadius: 20, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>+ Add New Product</button>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {products.map(p => (
              <div key={p.id} style={{ background: "#fff", borderRadius: 16, padding: 16, display: "flex", gap: 14, alignItems: "center", boxShadow: "0 3px 12px rgba(180,80,20,0.08)" }}>
                <div style={{ fontSize: 36 }}>{p.img}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#2d1b00" }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: "#c8430a", fontWeight: 800 }}>{formatPrice(p.price)}</div>
                  <div style={{ fontSize: 11, color: "#9a7a5a" }}>{p.category}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ background: "#e3f2fd", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#1565c0", fontSize: 12 }}>Edit</button>
                  <button style={{ background: "#ffebee", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#c62828", fontSize: 12 }}>Del</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(180,80,20,0.08)" }}>
              <h3 style={{ margin: "0 0 20px", color: "#2d1b00" }}>📊 Sales by Category</h3>
              {[["Pizza", 35], ["Cakes", 42], ["Snacks", 15], ["Drinks", 8]].map(([cat, pct]) => (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, color: "#7a5c3a" }}>
                    <span>{cat}</span><span style={{ fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 10, background: "#fff3e0", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #e07b00, #c8430a)", borderRadius: 6, transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(180,80,20,0.08)" }}>
              <h3 style={{ margin: "0 0 20px", color: "#2d1b00" }}>📈 Key Metrics</h3>
              {[["Avg. Order Value", "₹487"], ["Repeat Customers", "68%"], ["Delivery On Time", "94%"], ["Customer Satisfaction", "4.9/5"]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #fff3e0", fontSize: 14 }}>
                  <span style={{ color: "#7a5c3a" }}>{l}</span>
                  <span style={{ fontWeight: 800, color: "#c8430a" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(180,80,20,0.08)" }}>
          <h3 style={{ margin: "0 0 20px", color: "#2d1b00" }}>👥 Recent Users</h3>
          {TESTIMONIALS.map((u, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid #fff3e0" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #e07b00, #c8430a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>{u.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#2d1b00", fontSize: 14 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "#9a7a5a" }}>{u.city}</div>
              </div>
              <span style={{ fontSize: 12, background: "#e8f5e9", color: "#2e7d32", padding: "4px 10px", borderRadius: 12, fontWeight: 600 }}>Active</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactPage({ addToast }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #ffe0b2", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 40, color: "#2d1b00", marginBottom: 8 }}>📞 Contact Us</h1>
      <p style={{ color: "#9a7a5a", marginBottom: 40 }}>We'd love to hear from you!</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div>
          <div style={{ display: "grid", gap: 16 }}>
            {[["Name", "name", "text", "Your full name"], ["Email", "email", "email", "your@email.com"], ["Phone", "phone", "text", "+91 98765 43210"]].map(([l, k, t, ph]) => (
              <div key={k}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>{l}</label>
                <input type={t} style={inputStyle} placeholder={ph} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} onFocus={e => e.target.style.borderColor = "#c8430a"} onBlur={e => e.target.style.borderColor = "#ffe0b2"} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#7a5c3a", display: "block", marginBottom: 6 }}>Message</label>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 120 }} placeholder="How can we help you?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} onFocus={e => e.target.style.borderColor = "#c8430a"} onBlur={e => e.target.style.borderColor = "#ffe0b2"} />
            </div>
            <button onClick={() => addToast("Message sent! We'll reply within 24 hours. 💌", "success")} style={{ background: "linear-gradient(135deg, #e07b00, #c8430a)", color: "#fff", border: "none", borderRadius: 24, padding: "14px", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>Send Message 📧</button>
          </div>
        </div>
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(180,80,20,0.08)" }}>
            {[
              { icon: "📍", label: "Address", val: "Shop 12, Azad Market, Abu Road, Rajasthan 307026" },
              { icon: "📞", label: "Phone", val: "+91 98765 43210" },
              { icon: "📧", label: "Email", val: "hello@ghochupizza.com" },
              { icon: "⏰", label: "Hours", val: "Mon-Sun: 9:00 AM - 10:00 PM" },
            ].map(c => (
              <div key={c.label} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid #fff3e0" }}>
                <span style={{ fontSize: 24 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: "#9a7a5a", fontWeight: 600 }}>{c.label}</div>
                  <div style={{ fontSize: 15, color: "#2d1b00", fontWeight: 600 }}>{c.val}</div>
                </div>
              </div>
            ))}
          </div>
          <a href="https://wa.me/919876543210" style={{ display: "block", textDecoration: "none" }}>
            <div style={{
              background: "linear-gradient(135deg, #25d366, #128c7e)",
              borderRadius: 20, padding: "20px 24px",
              display: "flex", alignItems: "center", gap: 16,
              cursor: "pointer", color: "#fff",
            }}>
              <span style={{ fontSize: 40 }}>💬</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Chat on WhatsApp</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Get instant support & place orders</div>
              </div>
            </div>
          </a>
          <div style={{ background: "#e8f0fe", borderRadius: 20, overflow: "hidden", height: 180, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "#1565c0" }}>
            <div style={{ fontSize: 40 }}>🗺️</div>
            <div style={{ fontWeight: 700 }}>Abu Road, Rajasthan</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Google Maps</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ user, orders, wishlist, products, onNavigate }) {
  const [tab, setTab] = useState("orders");
  const wishedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36, background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 20px rgba(180,80,20,0.08)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #e07b00, #c8430a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff", fontWeight: 800 }}>{user.avatar}</div>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Georgia', serif", fontSize: 24, color: "#2d1b00" }}>{user.name}</h2>
          <p style={{ margin: 0, color: "#9a7a5a" }}>{user.email}</p>
          <span style={{ fontSize: 12, background: "#e8f5e9", color: "#2e7d32", padding: "3px 10px", borderRadius: 10, fontWeight: 700 }}>⭐ Premium Member</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["orders", "wishlist", "addresses", "settings"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 18px", borderRadius: 20, border: "none", cursor: "pointer", background: tab === t ? "linear-gradient(135deg, #e07b00, #c8430a)" : "#fff3e0", color: tab === t ? "#fff" : "#c8430a", fontWeight: 700, fontSize: 13, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>
      {tab === "orders" && (
        <div style={{ display: "grid", gap: 14 }}>
          {ADMIN_ORDERS.slice(0, 3).map(o => (
            <div key={o.id} style={{ background: "#fff", borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 3px 12px rgba(180,80,20,0.06)" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#c8430a" }}>{o.id}</div>
                <div style={{ fontSize: 14, color: "#2d1b00" }}>{o.item}</div>
                <div style={{ fontSize: 12, color: "#9a7a5a" }}>{o.date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#2d1b00" }}>₹{o.amount}</div>
                <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_COLORS[o.status] + "22", color: STATUS_COLORS[o.status] }}>{o.status.replace(/_/g, " ")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === "wishlist" && (
        wishedProducts.length === 0 ? <p style={{ color: "#9a7a5a", textAlign: "center", padding: 40 }}>No wishlist items yet. Start adding! ❤️</p> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {wishedProducts.map(p => (
              <div key={p.id} style={{ background: "#fff", borderRadius: 16, padding: 16, textAlign: "center", boxShadow: "0 3px 12px rgba(180,80,20,0.06)" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{p.img}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#2d1b00" }}>{p.name}</div>
                <div style={{ fontWeight: 800, color: "#c8430a", fontSize: 16 }}>{formatPrice(p.price)}</div>
              </div>
            ))}
          </div>
      )}
      {tab === "addresses" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 3px 12px rgba(180,80,20,0.06)" }}>
          <div style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid #fff3e0" }}>
            <span style={{ fontSize: 24 }}>🏠</span>
            <div>
              <div style={{ fontWeight: 700, color: "#2d1b00" }}>Home</div>
              <div style={{ fontSize: 13, color: "#7a5c3a" }}>12, Abu Road, Rajasthan 307026</div>
            </div>
          </div>
          <button style={{ marginTop: 16, background: "#fff3e0", border: "2px dashed #ffe0b2", borderRadius: 12, padding: "12px 20px", cursor: "pointer", color: "#c8430a", fontWeight: 600, width: "100%" }}>+ Add New Address</button>
        </div>
      )}
      {tab === "settings" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 3px 12px rgba(180,80,20,0.06)" }}>
          {["Email Notifications", "SMS Alerts", "Promotional Offers", "Order Updates"].map(s => (
            <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #fff3e0" }}>
              <span style={{ fontSize: 14, color: "#2d1b00" }}>{s}</span>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: "#4caf50", cursor: "pointer", position: "relative" }}>
                <div style={{ position: "absolute", right: 4, top: 4, width: 16, height: 16, borderRadius: "50%", background: "#fff" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────

export default function GhochuPizza() {
  const [page, setPage] = useState("home");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const addToCart = (product, qty = 1) => {
    setCart(c => {
      const exists = c.find(x => x.id === product.id);
      if (exists) return c.map(x => x.id === product.id ? { ...x, qty: x.qty + qty } : x);
      return [...c, { ...product, qty }];
    });
    addToast(`${product.name} added to cart! 🛒`, "success");
  };

  const updateCart = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(c => c.map(x => x.id === id ? { ...x, qty } : x));
  };

  const removeFromCart = (id) => {
    setCart(c => c.filter(x => x.id !== id));
    addToast("Item removed", "error");
  };

  const toggleWish = (id) => {
    setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
    addToast(wishlist.includes(id) ? "Removed from wishlist" : "Added to wishlist ❤️", "success");
  };

  const NAV_ITEMS = [
    { label: "Home", key: "home" },
    { label: "Menu", key: "menu" },
    { label: "Cakes", key: "cakes" },
    { label: "Custom Cake", key: "custom" },
    { label: "Party 🎈", key: "decoration" },
    { label: "Contact", key: "contact" },
    ...(user ? [{ label: "Admin ⚙️", key: "admin" }] : []),
  ];

  const bg = darkMode ? "#1a0e05" : "#fff8f0";
  const textColor = darkMode ? "#f5e6d0" : "#2d1b00";

  return (
    <div style={{
      minHeight: "100vh", background: bg, color: textColor,
      fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
      transition: "background 0.3s, color 0.3s",
    }}>
      <style>{`
        @keyframes float { from { transform: translateY(0); } to { transform: translateY(-12px); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #fff3e0; } ::-webkit-scrollbar-thumb { background: #c8430a; border-radius: 3px; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 900, background: "rgba(255,248,240,0.95)",
        backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(200,67,10,0.12)",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", height: 64, gap: 8 }}>
          <button onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", textDecoration: "none" }}>
            <span style={{ fontSize: 28 }}>🍕</span>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 900, color: "#c8430a" }}>Ghochu Pizza</span>
          </button>

          <div style={{ flex: 1 }} />

          {/* Desktop nav */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {NAV_ITEMS.map(item => (
              <button key={item.key} onClick={() => setPage(item.key)} style={{
                background: page === item.key ? "rgba(200,67,10,0.12)" : "none",
                border: "none", cursor: "pointer", padding: "7px 12px", borderRadius: 20,
                fontSize: 13, fontWeight: page === item.key ? 700 : 500,
                color: page === item.key ? "#c8430a" : "#5a3c1a",
                transition: "all 0.2s",
              }}>{item.label}</button>
            ))}
          </div>

          <button onClick={() => setDarkMode(d => !d)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 4 }}>
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* Cart */}
          <button onClick={() => setPage("cart")} style={{
            position: "relative", background: "none", border: "none", cursor: "pointer",
            fontSize: 22, padding: "4px 8px",
          }}>
            🛒
            {cart.length > 0 && (
              <span style={{
                position: "absolute", top: 0, right: 0, background: "#c8430a", color: "#fff",
                borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{cart.reduce((s, x) => s + x.qty, 0)}</span>
            )}
          </button>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setPage("profile")} style={{
                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #e07b00, #c8430a)",
                color: "#fff", fontWeight: 700, fontSize: 14,
              }}>{user.avatar}</button>
            </div>
          ) : (
            <button onClick={() => setPage("auth")} style={{
              background: "linear-gradient(135deg, #e07b00, #c8430a)",
              color: "#fff", border: "none", borderRadius: 20, padding: "8px 20px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>Login</button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {page === "home" && <HomePage onNavigate={setPage} products={PRODUCTS} onAddToCart={addToCart} wishlist={wishlist} onToggleWish={toggleWish} onQuickView={setQuickViewProduct} />}
        {page === "menu" && <MenuPage products={PRODUCTS} onAddToCart={addToCart} wishlist={wishlist} onToggleWish={toggleWish} onQuickView={setQuickViewProduct} />}
        {page === "cakes" && <CakesPage products={PRODUCTS} onAddToCart={addToCart} wishlist={wishlist} onToggleWish={toggleWish} onQuickView={setQuickViewProduct} />}
        {page === "custom" && <CustomCakePage addToast={addToast} />}
        {page === "decoration" && <DecorationPage addToast={addToast} />}
        {page === "cart" && <CartPage cart={cart} onUpdate={updateCart} onRemove={removeFromCart} onNavigate={setPage} addToast={addToast} />}
        {page === "auth" && <AuthPage setUser={(u) => { setUser(u); setPage("home"); }} addToast={addToast} />}
        {page === "admin" && <AdminPage orders={ADMIN_ORDERS} products={PRODUCTS} addToast={addToast} />}
        {page === "contact" && <ContactPage addToast={addToast} />}
        {page === "profile" && user && <ProfilePage user={user} orders={ADMIN_ORDERS} wishlist={wishlist} products={PRODUCTS} onNavigate={setPage} />}
      </main>

      {/* Footer */}
      <footer style={{
        background: "linear-gradient(135deg, #2d1b00, #1a0e00)",
        color: "#f5e6d0", padding: "48px 24px 24px",
        marginTop: 60,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 32 }}>🍕</span>
                <span style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 900, color: "#f5a623" }}>Ghochu Pizza</span>
              </div>
              <p style={{ color: "#c4a882", lineHeight: 1.7, fontSize: 14 }}>Handcrafted cakes, pizzas & sweet memories. Delivering happiness since 2018 across Rajasthan.</p>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                {["📘", "📸", "🐦", "▶️"].map((icon, i) => (
                  <div key={i} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>{icon}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ color: "#f5a623", marginBottom: 16, fontSize: 15 }}>Quick Links</h4>
              {["Home", "Menu", "Custom Cake", "Party Decoration", "Contact"].map(l => (
                <div key={l} style={{ color: "#c4a882", fontSize: 14, marginBottom: 8, cursor: "pointer" }}>{l}</div>
              ))}
            </div>
            <div>
              <h4 style={{ color: "#f5a623", marginBottom: 16, fontSize: 15 }}>Our Products</h4>
              {["Birthday Cakes", "Wedding Cakes", "Pizza & Snacks", "Pastries", "Drinks"].map(l => (
                <div key={l} style={{ color: "#c4a882", fontSize: 14, marginBottom: 8 }}>{l}</div>
              ))}
            </div>
            <div>
              <h4 style={{ color: "#f5a623", marginBottom: 16, fontSize: 15 }}>Newsletter</h4>
              <p style={{ color: "#c4a882", fontSize: 13, marginBottom: 12 }}>Get exclusive offers & updates!</p>
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="Your email" style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "none", background: "rgba(255,255,255,0.1)", color: "#f5e6d0", fontSize: 13, outline: "none" }} />
                <button style={{ background: "linear-gradient(135deg, #e07b00, #c8430a)", color: "#fff", border: "none", borderRadius: 20, padding: "10px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>→</button>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 13, color: "#9a7a5a" }}>
            <span>© 2026 Ghochu Pizza. All rights reserved.</span>
            <span>Made with ❤️ in Rajasthan, India</span>
          </div>
        </div>
      </footer>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onAddToCart={addToCart} />
      )}

      {/* Toast Notifications */}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 10, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === "success" ? "#2e7d32" : "#c62828",
            color: "#fff", padding: "12px 20px", borderRadius: 16,
            fontSize: 14, fontWeight: 600, maxWidth: 320,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            animation: "slideIn 0.3s ease",
          }}>{t.msg}</div>
        ))}
      </div>

      {/* WhatsApp Button */}
      <a href="https://wa.me/919876543210" style={{
        position: "fixed", bottom: 88, left: 24, width: 52, height: 52, borderRadius: "50%",
        background: "linear-gradient(135deg, #25d366, #128c7e)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, boxShadow: "0 4px 20px rgba(37,211,102,0.4)",
        textDecoration: "none", zIndex: 800,
        transition: "transform 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >💬</a>
    </div>
  );
}
