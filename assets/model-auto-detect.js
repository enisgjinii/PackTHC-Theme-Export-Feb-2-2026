/**
 * PackTHC – 3D Model Auto-Detect
 * Checks whether the current product has a matching 3D model in the configurator
 * by querying the /api/models/match endpoint. Shows the "Customize in 3D" button
 * only when a real model match is found; hides it otherwise.
 *
 * Usage: loaded on product pages via the customize-3d-button snippet.
 */
(function () {
  'use strict';

  /* ─── Config ─── */
  var CONFIGURATOR_BASE =
    window.__PACKTHC_CONFIGURATOR_URL__ ||
    'https://dram-product-customizer.vercel.app';
  var API_ENDPOINT = CONFIGURATOR_BASE + '/api/models/match';
  var CACHE_KEY = 'packthc_3d_model_match_v2';
  var CACHE_TTL = 1000 * 60 * 60; // 1 hour

  /* ─── DOM helpers ─── */
  function getWrapper() {
    return document.querySelector('[data-3d-autodetect]');
  }

  function showWrapper(wrapper, category) {
    wrapper.style.display = '';
    if (category) wrapper.setAttribute('data-model-category', category);
    else wrapper.removeAttribute('data-model-category');
  }

  function hideWrapper(wrapper) {
    wrapper.style.display = 'none';
  }

  /* ─── Product info helpers ─── */
  function getMetaProduct() {
    return (
      window.ShopifyAnalytics &&
      window.ShopifyAnalytics.meta &&
      window.ShopifyAnalytics.meta.product
    ) || null;
  }

  function getProductTitle(wrapper) {
    if (wrapper.dataset.productTitle) return wrapper.dataset.productTitle;
    var meta = getMetaProduct();
    if (meta) return meta.name || meta.title || meta.type || '';
    var og = document.querySelector('meta[property="og:title"]');
    if (og) return og.getAttribute('content') || '';
    var h1 = document.querySelector('.product__title h1, h1.product__title, [data-product-title]');
    return h1 ? h1.textContent.trim() : '';
  }

  function getProductHandle(wrapper) {
    if (wrapper.dataset.productHandle) return wrapper.dataset.productHandle;
    var m = window.location.pathname.match(/\/products\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function getProductType(wrapper) {
    if (wrapper.dataset.productType) return wrapper.dataset.productType;
    var meta = getMetaProduct();
    return meta ? meta.type || '' : '';
  }

  function getProductSku(wrapper) {
    return wrapper.dataset.productSku || '';
  }

  /* ─── Cache ─── */
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
    } catch (e) { /* storage full */ }
  }

  /* ─── Apply result ─── */
  function applyResult(wrapper, data) {
    if (data.matched) {
      showWrapper(wrapper, data.category || null);
      // Append model_category to the button href for auto-selection in the configurator
      var link = wrapper.querySelector('.customize-3d-btn');
      if (link && data.category) {
        var href = link.getAttribute('href') || '';
        if (href.indexOf('model_category=') === -1) {
          var sep = href.indexOf('?') !== -1 ? '&' : '?';
          link.setAttribute('href', href + sep + 'model_category=' + encodeURIComponent(data.category));
        }
      }
    } else {
      hideWrapper(wrapper);
    }
  }

  /* ─── Main ─── */
  function checkAndReveal() {
    var wrapper = getWrapper();
    if (!wrapper) return;

    // Start hidden; only reveal once we have a confirmed match.
    wrapper.style.display = 'none';

    var handle = getProductHandle(wrapper);
    var title = getProductTitle(wrapper);
    var productType = getProductType(wrapper);
    var sku = getProductSku(wrapper);

    // If we have no product info at all, hide silently.
    if (!handle && !title) return;

    // Check session cache first to avoid redundant network requests.
    var cached = getCached(handle);
    if (cached !== null) {
      applyResult(wrapper, cached);
      return;
    }

    // Build query params and call the configurator's match API.
    var params = new URLSearchParams();
    if (title) params.set('title', title);
    if (handle) params.set('handle', handle.replace(/-/g, ' '));
    if (productType) params.set('type', productType);
    if (sku) params.set('sku', sku);

    fetch(API_ENDPOINT + '?' + params.toString(), { method: 'GET', mode: 'cors' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        setCache(handle, data);
        applyResult(wrapper, data);
      })
      .catch(function () {
        // On network error, hide the button so we don't show it for products
        // that almost certainly have no model (rather than falsely advertising it).
        hideWrapper(wrapper);
      });
  }

  /* ─── Init ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndReveal);
  } else {
    checkAndReveal();
  }
})();
