/**
 * PackTHC 3D Product Customizer — Bridge Script
 * Handles communication between the Shopify theme and the customizer iframe.
 *
 * Loaded by the product-customizer-embed section.
 */
(function () {
  "use strict";

  /* ───────── CONFIG ───────── */
  var CUSTOMIZER_ORIGIN = ""; // set dynamically from data-attribute

  /* ───────── STATE ───────── */
  var modal = null;
  var iframe = null;
  var overlay = null;
  var closeBtn = null;
  var isOpen = false;

  /* ───────── HELPERS ───────── */
  function getProductData() {
    var el = document.getElementById("packthc-customizer-data");
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      console.error("[Customizer] Failed to parse product data", e);
      return null;
    }
  }

  function buildCustomizerUrl(baseUrl) {
    var data = getProductData();
    if (!data) return baseUrl;

    var params = new URLSearchParams();
    if (data.product_id) params.set("product_id", data.product_id);
    if (data.variant_id) params.set("variant_id", data.variant_id);
    if (data.handle) params.set("product", data.handle);
    if (data.title) params.set("title", encodeURIComponent(data.title));
    if (data.sku) params.set("sku", data.sku);
    if (data.vendor) params.set("vendor", encodeURIComponent(data.vendor));
    if (data.price) params.set("price", data.price);
    if (data.image) params.set("image", encodeURIComponent(data.image));
    params.set("shop", window.Shopify ? Shopify.shop : window.location.host);
    params.set(
      "shop_name",
      encodeURIComponent(
        document.querySelector('meta[name="og:site_name"]')
          ? document
              .querySelector('meta[name="og:site_name"]')
              .getAttribute("content")
          : "PackTHC"
      )
    );

    return baseUrl + "?" + params.toString();
  }

  /* ───────── SHOPIFY CART (AJAX API) ───────── */
  function addToShopifyCart(variantId, quantity, properties) {
    var body = {
      items: [
        {
          id: parseInt(variantId, 10),
          quantity: quantity || 1,
          properties: properties || {},
        },
      ],
    };

    return fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Cart error: " + res.status);
        return res.json();
      })
      .then(function (data) {
        console.log("[Customizer] Added to cart:", data);
        // Update cart count in header
        updateCartCount();
        // Show success feedback
        showNotification("Product added to cart!", "success");
        return data;
      })
      .catch(function (err) {
        console.error("[Customizer] Cart error:", err);
        showNotification("Failed to add to cart. Please try again.", "error");
      });
  }

  function updateCartCount() {
    fetch("/cart.js")
      .then(function (res) {
        return res.json();
      })
      .then(function (cart) {
        // Try common selectors for cart count badges
        var badges = document.querySelectorAll(
          ".cart-count, .cart-count-badge, [data-cart-count], .header__cart-count, .cart-count-bubble span"
        );
        badges.forEach(function (badge) {
          badge.textContent = cart.item_count;
        });
        // Dispatch custom event for themes that listen
        document.dispatchEvent(
          new CustomEvent("cart:updated", { detail: cart })
        );
      });
  }

  function showNotification(message, type) {
    var notif = document.createElement("div");
    notif.className = "packthc-notif packthc-notif--" + type;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(function () {
      notif.classList.add("packthc-notif--visible");
    }, 10);
    setTimeout(function () {
      notif.classList.remove("packthc-notif--visible");
      setTimeout(function () {
        notif.remove();
      }, 300);
    }, 3000);
  }

  /* ───────── MESSAGE HANDLER ───────── */
  function handleMessage(event) {
    // Only accept messages from the customizer
    if (CUSTOMIZER_ORIGIN && event.origin !== CUSTOMIZER_ORIGIN) return;

    var msg = event.data;
    if (!msg || typeof msg !== "object") return;

    switch (msg.type) {
      case "addToCart":
        console.log("[Customizer] addToCart message received:", msg);
        addToShopifyCart(msg.variantId, msg.quantity, msg.properties).then(
          function () {
            if (!msg.redirectToCart) {
              // Keep customizer open, cart updated in background
            } else {
              closeCustomizer();
              window.location.href = "/cart";
            }
          }
        );
        break;

      case "goBack":
        closeCustomizer();
        break;

      case "customizerReady":
        console.log("[Customizer] Iframe ready");
        break;

      default:
        break;
    }
  }

  /* ───────── MODAL OPEN / CLOSE ───────── */
  function openCustomizer() {
    if (isOpen) return;

    modal = document.getElementById("packthc-customizer-modal");
    iframe = document.getElementById("packthc-customizer-iframe");
    overlay = document.getElementById("packthc-customizer-overlay");
    closeBtn = document.getElementById("packthc-customizer-close");

    if (!modal || !iframe) {
      console.error("[Customizer] Modal elements not found");
      return;
    }

    var baseUrl = modal.getAttribute("data-customizer-url");
    CUSTOMIZER_ORIGIN = new URL(baseUrl).origin;
    iframe.src = buildCustomizerUrl(baseUrl);

    modal.classList.add("packthc-modal--open");
    document.body.classList.add("packthc-modal-active");
    isOpen = true;

    window.addEventListener("message", handleMessage);
  }

  function closeCustomizer() {
    if (!isOpen) return;

    modal.classList.remove("packthc-modal--open");
    document.body.classList.remove("packthc-modal-active");
    isOpen = false;

    // Destroy iframe to free GPU / memory
    if (iframe) iframe.src = "about:blank";
    window.removeEventListener("message", handleMessage);
  }

  /* ───────── INIT ───────── */
  function init() {
    // Bind open buttons
    document.querySelectorAll("[data-open-customizer]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        openCustomizer();
      });
    });

    // Bind close
    document.addEventListener("click", function (e) {
      if (
        e.target.id === "packthc-customizer-close" ||
        e.target.id === "packthc-customizer-overlay"
      ) {
        closeCustomizer();
      }
    });

    // ESC key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) closeCustomizer();
    });

    // Listen for variant changes in the product form
    document.addEventListener("change", function (e) {
      if (
        e.target.matches(
          'input[name="id"], select[name="id"], .product-variant-id'
        )
      ) {
        var dataEl = document.getElementById("packthc-customizer-data");
        if (dataEl) {
          try {
            var data = JSON.parse(dataEl.textContent);
            data.variant_id = e.target.value;
            dataEl.textContent = JSON.stringify(data);
          } catch (err) {
            /* ignore */
          }
        }
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
