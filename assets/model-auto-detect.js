/**
 * PackTHC – 3D Model Auto-Detect
 * Automatically checks if the current product has a matching 3D model
 * by querying the configurator API. Shows/hides the "Customize in 3D" button.
 *
 * Usage: loaded on product pages via the customize-3d-button snippet.
 */
(function () {
  'use strict';

  /* ─── Config ─── */
  var CONFIGURATOR_BASE =
    window.__PACKTHC_CONFIGURATOR_URL__ ||
    'https://dram-product-customizer.vercel.app';
  var API_ENDPOINT = CONFIGURATOR_BASE + '/api/model-categories';
  var CACHE_KEY = 'packthc_3d_model_match';
  var CACHE_TTL = 1000 * 60 * 60; // 1 hour

  /* ─── Helpers ─── */
  function getWrapper() {
    return document.querySelector('[data-3d-autodetect]');
  }

  function getProductMetaProduct() {
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
      return window.ShopifyAnalytics.meta.product;
    }
    return null;
  }

  function getProductTitle(wrapper) {
    if (wrapper && wrapper.dataset.productTitle) {
      return wrapper.dataset.productTitle;
    }

    var metaProduct = getProductMetaProduct();
    if (metaProduct) {
      return metaProduct.name || metaProduct.title || metaProduct.type || '';
    }

    var metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) return metaTitle.getAttribute('content') || '';

    var h1 = document.querySelector('.product__title h1, h1.product__title, [data-product-title]');
    if (h1) return h1.textContent.trim();

    return '';
  }

  function getProductHandle(wrapper) {
    if (wrapper && wrapper.dataset.productHandle) {
      return wrapper.dataset.productHandle;
    }

    var path = window.location.pathname;
    var match = path.match(/\/products\/([^/?#]+)/);
    if (match) return decodeURIComponent(match[1]);
    return '';
  }

  function getProductType(wrapper) {
    if (wrapper && wrapper.dataset.productType) {
      return wrapper.dataset.productType;
    }

    var metaProduct = getProductMetaProduct();
    if (metaProduct) {
      return metaProduct.type || '';
    }

    return '';
  }

  function getProductSku(wrapper) {
    if (wrapper && wrapper.dataset.productSku) {
      return wrapper.dataset.productSku;
    }

    return '';
  }

  function getCached(handle) {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY + '_' + handle);
      if (!raw) return null;
      var cached = JSON.parse(raw);
      if (Date.now() - cached.ts > CACHE_TTL) {
        sessionStorage.removeItem(CACHE_KEY + '_' + handle);
        return null;
      }
      return cached.data;
    } catch (e) {
      return null;
    }
  }

  function setCache(handle, data) {
    try {
      sessionStorage.setItem(
        CACHE_KEY + '_' + handle,
        JSON.stringify({ ts: Date.now(), data: data })
      );
    } catch (e) {
      /* storage full – ignore */
    }
  }

  /* ─── Main logic ─── */
  function checkAndReveal() {
    var wrapper = getWrapper();
    if (!wrapper) return;

    var handle = getProductHandle(wrapper);
    var title = getProductTitle(wrapper);
    var productType = getProductType(wrapper);
    var sku = getProductSku(wrapper);

    // Build search query: combine title, handle, product type, and SKU.
    var searchQuery = [title, handle.replace(/-/g, ' '), productType, sku]
      .filter(Boolean)
      .join(' ');

    if (!searchQuery.trim()) {
      // No product info → fail open so the configurator CTA never disappears entirely.
      wrapper.style.display = '';
      return;
    }

    // Check cache first
    var cached = getCached(handle);
    if (cached !== null) {
      if (cached.matched) {
        wrapper.style.display = '';
        wrapper.setAttribute('data-model-category', cached.category || '');
      } else {
        wrapper.style.display = '';
        wrapper.removeAttribute('data-model-category');
      }
      return;
    }

    // Query the API
    var url = API_ENDPOINT + '?product=' + encodeURIComponent(searchQuery);

    fetch(url, { method: 'GET', mode: 'cors' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        setCache(handle, data);
        if (data.matched) {
          wrapper.style.display = '';
          wrapper.setAttribute('data-model-category', data.category || '');
          // Also update the link to include category for auto-selection
          var link = wrapper.querySelector('.customize-3d-btn');
          if (link && data.category) {
            var href = link.getAttribute('href') || '';
            if (href.indexOf('model_category=') === -1) {
              var sep = href.indexOf('?') !== -1 ? '&' : '?';
              link.setAttribute('href', href + sep + 'model_category=' + encodeURIComponent(data.category));
            }
          }
        } else {
          // Keep the CTA visible even when auto-detect cannot confidently classify the product.
          // The configurator app has its own smarter fallback matcher and default model handling.
          wrapper.style.display = '';
          wrapper.removeAttribute('data-model-category');
        }
      })
      .catch(function () {
        // On error, show the button as fallback (don't block users)
        wrapper.style.display = '';
      });
  }

  /* ─── Init ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndReveal);
  } else {
    checkAndReveal();
  }
})();
