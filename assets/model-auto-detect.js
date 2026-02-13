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
  function getProductTitle() {
    // Try Shopify's global product object first
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
      return window.ShopifyAnalytics.meta.product.type || window.ShopifyAnalytics.meta.product.name || '';
    }
    // Fallback: read from meta or h1
    var metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) return metaTitle.getAttribute('content') || '';
    var h1 = document.querySelector('.product__title h1, h1.product__title, [data-product-title]');
    if (h1) return h1.textContent.trim();
    return '';
  }

  function getProductHandle() {
    // From URL path
    var path = window.location.pathname;
    var match = path.match(/\/products\/([^/?#]+)/);
    if (match) return decodeURIComponent(match[1]);
    return '';
  }

  function getProductType() {
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
      return window.ShopifyAnalytics.meta.product.type || '';
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
    var wrapper = document.querySelector('[data-3d-autodetect]');
    if (!wrapper) return;

    var handle = getProductHandle();
    var title = getProductTitle();
    var productType = getProductType();

    // Build search query: combine title, handle, product type
    var searchQuery = [title, handle.replace(/-/g, ' '), productType]
      .filter(Boolean)
      .join(' ');

    if (!searchQuery.trim()) {
      // No product info → hide button
      wrapper.style.display = 'none';
      return;
    }

    // Check cache first
    var cached = getCached(handle);
    if (cached !== null) {
      if (cached.matched) {
        wrapper.style.display = '';
        wrapper.setAttribute('data-model-category', cached.category || '');
      } else {
        wrapper.style.display = 'none';
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
          wrapper.style.display = 'none';
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
