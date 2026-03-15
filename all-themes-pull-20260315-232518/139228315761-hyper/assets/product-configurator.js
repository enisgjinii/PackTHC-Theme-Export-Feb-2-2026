/**
 * PackTHC Product Configurator — JS Controller
 * Handles iframe communication, cart integration, and UI state.
 */
(function () {
  'use strict';

  /* ────────────── Constants ────────────── */
  const CART_ADD_COOLDOWN = 2000;
  const LOADING_TIMEOUT  = 15000;
  const MAX_RETRIES      = 3;

  /* ────────────── State ────────────── */
  let isAddingToCart  = false;
  let lastCartAddTs   = 0;

  /* ════════════════════════════════════════
     Utility helpers
     ════════════════════════════════════════ */

  /** Build the iframe URL from product data + base URL */
  function buildIframeUrl(baseUrl, productData, shopData) {
    if (!baseUrl) return null;

    const params = new URLSearchParams();

    // Product params
    if (productData.handle)    params.set('product',    productData.handle);
    if (productData.productId) params.set('product_id', productData.productId);
    if (productData.variantId) params.set('variant_id', productData.variantId);
    // URLSearchParams handles encoding; avoid double-encoding values.
    if (productData.title)     params.set('title',      productData.title);
    if (productData.sku)       params.set('sku',        productData.sku);
    if (productData.vendor)    params.set('vendor',     productData.vendor);
    if (productData.image)     params.set('image',      productData.image);
    if (productData.price)     params.set('price',      productData.price);

    // Shop params
    if (shopData.domain)  params.set('shop',      shopData.domain);
    if (shopData.name)    params.set('shop_name', shopData.name);

    const sep = baseUrl.includes('?') ? '&' : '?';
    return baseUrl + sep + params.toString();
  }

  /** Parse a Shopify variant GID to numeric id */
  function parseVariantId(raw) {
    if (!raw) return null;
    if (typeof raw === 'number') return raw;
    const str = String(raw);
    if (str.includes('gid://')) {
      const num = parseInt(str.split('/').pop(), 10);
      return isNaN(num) ? null : num;
    }
    const parsed = parseInt(str, 10);
    return isNaN(parsed) ? null : parsed;
  }

  /** Truncate a string to `max` chars */
  function truncate(str, max) {
    if (!str) return '';
    return String(str).substring(0, max);
  }

  /* ════════════════════════════════════════
     Cart — add with retry + exp-backoff
     ════════════════════════════════════════ */
  async function addToCartWithRetry(cartPayload, retries, delay) {
    retries = retries || MAX_RETRIES;
    delay   = delay   || 1000;

    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cartPayload),
        });

        if (res.status === 429) {
          // rate-limited → backoff
          console.warn('[Configurator] Rate-limited, retrying in', delay, 'ms');
          await sleep(delay);
          delay *= 2;
          continue;
        }

        if (!res.ok) {
          const text = await res.text();
          let msg = 'Failed to add to cart';
          try { msg = JSON.parse(text).description || msg; } catch (_) {}
          throw new Error(msg);
        }

        return await res.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        console.warn('[Configurator] Retry', i + 1, '/', retries);
        await sleep(delay);
      }
    }
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ════════════════════════════════════════
     Cart-count header update
     ════════════════════════════════════════ */
  function refreshCartCount() {
    fetch('/cart.js')
      .then(r => r.json())
      .then(cart => {
        const selectors = [
          '.item-count', '.cart-item-count', '.cart-count',
          '.cart-count-bubble', '.header-cart-count',
          '[data-cart-count]', '.CartCount', '.cart-items-count',
        ];
        document.querySelectorAll(selectors.join(',')).forEach(el => {
          el.textContent = cart.item_count;
          if (cart.item_count > 0) {
            el.style.display = '';
            el.classList.remove('hide', 'hidden');
          }
        });
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
        document.dispatchEvent(new Event('cart:refresh'));
      })
      .catch(() => { /* silent */ });
  }

  /* ════════════════════════════════════════
     Toast notifications
     ════════════════════════════════════════ */
  function showToast(message, opts) {
    opts = opts || {};
    const type = opts.type || 'success'; // success | error | info

    // Remove existing toasts
    document.querySelectorAll('.configurator-toast').forEach(el => el.remove());

    const toast = document.createElement('div');
    toast.className = 'configurator-toast configurator-toast--' + type;

    const iconSvg = type === 'error'
      ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
      : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';

    let actionsHtml = '';
    if (type === 'success') {
      actionsHtml = `
        <div class="configurator-toast__actions">
          <a href="/cart" class="configurator-toast__btn configurator-toast__btn--primary">View Cart</a>
          <button class="configurator-toast__btn configurator-toast__btn--ghost" onclick="this.closest('.configurator-toast').remove()">Dismiss</button>
        </div>`;
    }

    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconSvg}</svg>
      <span>${message}</span>
      ${actionsHtml}
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toast-out 0.35s ease forwards';
      setTimeout(() => toast.remove(), 350);
    }, opts.duration || 5000);
  }

  /* ════════════════════════════════════════
     Fullscreen toggle
     ════════════════════════════════════════ */
  function toggleFullscreen(wrapper) {
    if (!wrapper) return;
    wrapper.classList.toggle('is-fullscreen');
    const isFs = wrapper.classList.contains('is-fullscreen');
    document.body.style.overflow = isFs ? 'hidden' : '';

    // Update button icon
    const btn = wrapper.querySelector('[data-action="fullscreen"]');
    if (btn) {
      btn.title = isFs ? 'Exit Fullscreen' : 'Fullscreen';
      btn.querySelector('.fs-expand')?.classList.toggle('hidden', isFs);
      btn.querySelector('.fs-collapse')?.classList.toggle('hidden', !isFs);
    }
  }

  /* ════════════════════════════════════════
     Main initializer
     ════════════════════════════════════════ */
  function initConfigurator(sectionEl) {
    const wrapper         = sectionEl.querySelector('.configurator-wrapper');
    const iframe          = sectionEl.querySelector('.configurator-iframe');
    const iframeContainer = sectionEl.querySelector('.configurator-iframe-container');
    const loadingOverlay  = sectionEl.querySelector('.configurator-loading');
    const errorContainer  = sectionEl.querySelector('.configurator-error');

    if (!iframe || !wrapper) return;

    function showFatalError(message) {
      if (iframeContainer) iframeContainer.style.display = 'none';
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (errorContainer) {
        const textNode = errorContainer.querySelector('.configurator-error__text');
        if (textNode && message) textNode.textContent = message;
        errorContainer.style.display = 'block';
      }
    }

    // ── Read product data (embedded as JSON in a <script> tag) ──
    let productData = {};
    let shopData    = {};
    let baseUrl     = '';
    try {
      const dataEl = sectionEl.querySelector('[data-configurator-config]');
      if (dataEl) {
        const config  = JSON.parse(dataEl.textContent);
        productData   = config.product  || {};
        shopData      = config.shop     || {};
        baseUrl       = config.baseUrl  || '';
      }
    } catch (e) {
      console.error('[Configurator] Failed to parse config', e);
    }

    // ── Build iframe URL ──
    // Also check URL params (standalone /pages/configurator usage)
    const urlParams = new URLSearchParams(window.location.search);
    if (!productData.handle && urlParams.get('product')) {
      productData.handle    = urlParams.get('product');
      productData.productId = urlParams.get('product_id');
      productData.variantId = urlParams.get('variant_id');
      productData.title     = urlParams.get('title') ? decodeURIComponent(urlParams.get('title')) : null;
      productData.sku       = urlParams.get('sku');
      productData.vendor    = urlParams.get('vendor') ? decodeURIComponent(urlParams.get('vendor')) : null;
      productData.image     = urlParams.get('image') ? decodeURIComponent(urlParams.get('image')) : null;
      productData.price     = urlParams.get('price');
    }

    if (productData.handle || productData.productId) {
      const iframeUrl = buildIframeUrl(baseUrl, productData, shopData);

      if (iframeUrl) {
        iframe.src = iframeUrl;
        if (iframeContainer) iframeContainer.style.display = 'block';
        if (errorContainer)  errorContainer.style.display  = 'none';
      } else {
        showFatalError('Configurator URL is missing. Please check theme settings.');
        return;
      }
    } else {
      // No product — show error
      showFatalError('Please select a product to customize from our catalog.');
      return;
    }

    // ── Loading state ──
    const loadingTimer = setTimeout(() => {
      if (loadingOverlay) loadingOverlay.style.display = 'none';
    }, LOADING_TIMEOUT);

    iframe.addEventListener('load', () => {
      clearTimeout(loadingTimer);
      if (loadingOverlay) loadingOverlay.style.display = 'none';
    });

    iframe.addEventListener('error', () => {
      clearTimeout(loadingTimer);
      showFatalError('Failed to load configurator. Please refresh and try again.');
    });

    // ── Fullscreen button ──
    const fsBtn = sectionEl.querySelector('[data-action="fullscreen"]');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => toggleFullscreen(wrapper));
    }

    // ── ESC to exit fullscreen ──
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wrapper.classList.contains('is-fullscreen')) {
        toggleFullscreen(wrapper);
      }
    });

    // ── Refresh button ──
    const refreshBtn = sectionEl.querySelector('[data-action="refresh"]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        iframe.src = iframe.src; // reload
      });
    }

    // ── Direct Add to Cart button (in product-info-bar) ──
    const addToCartBtn = sectionEl.querySelector('.btn-add-to-cart');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', async function () {
        var variantId = parseVariantId(addToCartBtn.getAttribute('data-variant-id') || productData.variantId);
        if (!variantId) {
          showToast('Error: No product variant selected.', { type: 'error' });
          return;
        }

        if (isAddingToCart) {
          showToast('Already adding to cart…', { type: 'info', duration: 2000 });
          return;
        }

        var now = Date.now();
        if (now - lastCartAddTs < CART_ADD_COOLDOWN) {
          showToast('Please wait a moment before adding again.', { type: 'info', duration: 2000 });
          return;
        }

        isAddingToCart = true;
        lastCartAddTs = now;

        // UI: show spinner on button
        var btnText = addToCartBtn.querySelector('.btn-add-to-cart__text');
        var btnSpinner = addToCartBtn.querySelector('.btn-add-to-cart__spinner');
        if (btnText) btnText.textContent = 'Adding…';
        if (btnSpinner) btnSpinner.classList.remove('hidden');
        addToCartBtn.disabled = true;

        var payload = {
          id: variantId,
          quantity: 1,
          properties: {},
        };

        try {
          await addToCartWithRetry(payload);
          isAddingToCart = false;
          showToast('Product added to cart!', { type: 'success' });
          refreshCartCount();

          // Briefly show success state
          if (btnText) btnText.textContent = 'Added ✓';
          addToCartBtn.classList.add('btn-add-to-cart--success');
          setTimeout(function () {
            if (btnText) btnText.textContent = 'Add to Cart';
            if (btnSpinner) btnSpinner.classList.add('hidden');
            addToCartBtn.disabled = false;
            addToCartBtn.classList.remove('btn-add-to-cart--success');
          }, 2000);
        } catch (err) {
          isAddingToCart = false;
          if (btnText) btnText.textContent = 'Add to Cart';
          if (btnSpinner) btnSpinner.classList.add('hidden');
          addToCartBtn.disabled = false;
          showToast('Failed to add to cart: ' + err.message, { type: 'error' });
        }
      });
    }

    // ── Listen for postMessage from iframe ──
    window.addEventListener('message', async function handler(event) {
      if (event.source !== iframe.contentWindow) return;
      if (!event.data || !event.data.type) return;

      const type = event.data.type;

      /* ─── Add to Cart ─── */
      if (type === 'addToCart') {
        const now = Date.now();
        if (isAddingToCart) {
          showToast('Already adding to cart…', { type: 'info', duration: 2000 });
          return;
        }
        if (now - lastCartAddTs < CART_ADD_COOLDOWN) {
          showToast('Please wait a moment before adding again.', { type: 'info', duration: 2000 });
          return;
        }

        isAddingToCart = true;
        lastCartAddTs  = now;

        // Resolve variant ID
        let variantId = parseVariantId(event.data.variantId || productData.variantId);
        if (!variantId) {
          showToast('Error: No product variant selected.', { type: 'error' });
          isAddingToCart = false;
          return;
        }

        // Clean properties (Shopify 255 char limit)
        const properties = {};
        if (event.data.properties) {
          Object.keys(event.data.properties).forEach(key => {
            properties[key] = truncate(event.data.properties[key], 250);
          });
        }

        const payload = {
          id: variantId,
          quantity: event.data.quantity || 1,
          properties: properties,
        };

        try {
          const result = await addToCartWithRetry(payload);
          isAddingToCart = false;

          // Notify iframe
          iframe.contentWindow.postMessage({ type: 'cartAddSuccess', data: result }, '*');

          showToast('Product added to cart!', { type: 'success' });
          refreshCartCount();

          // Optional redirect
          if (event.data.redirectToCart) {
            window.location.href = '/cart';
          }
        } catch (err) {
          isAddingToCart = false;
          iframe.contentWindow.postMessage({ type: 'cartAddError', error: err.message }, '*');
          showToast('Failed to add to cart. Please try again.', { type: 'error' });
        }
      }

      /* ─── Navigate ─── */
      if (type === 'goToCart') {
        window.location.href = '/cart';
      }
      if (type === 'goBack') {
        window.history.back();
      }

      /* ─── Toggle Fullscreen ─── */
      if (type === 'toggleFullscreen') {
        toggleFullscreen(wrapper);
      }
    });
  }

  /* ════════════════════════════════════════
     Document ready
     ════════════════════════════════════════ */
  function onReady() {
    document.querySelectorAll('.product-configurator-section').forEach(initConfigurator);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  // Support Shopify section rendering API (theme editor)
  document.addEventListener('shopify:section:load', function (e) {
    const section = e.target;
    if (section && section.classList.contains('product-configurator-section')) {
      initConfigurator(section);
    }
  });
})();
