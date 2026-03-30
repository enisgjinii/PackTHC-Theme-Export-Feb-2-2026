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
    if (productData.qtyTable != null)   params.set('qty_table',   typeof productData.qtyTable === 'string' ? productData.qtyTable : JSON.stringify(productData.qtyTable));
    if (productData.priceTable != null) params.set('price_table', typeof productData.priceTable === 'string' ? productData.priceTable : JSON.stringify(productData.priceTable));
    if (productData.unitTable != null)  params.set('unit_table',  typeof productData.unitTable === 'string' ? productData.unitTable : JSON.stringify(productData.unitTable));

    // Shop params
    if (shopData.domain)  params.set('shop',      shopData.domain);
    if (shopData.name)    params.set('shop_name', shopData.name);

    const sep = baseUrl.includes('?') ? '&' : '?';
    return baseUrl + sep + params.toString();
  }

  /** Fetch product details from Shopify AJAX API using product handle */
  async function fetchProductByHandle(handle) {
    if (!handle) return null;

    try {
      const res = await fetch('/products/' + encodeURIComponent(handle) + '.js', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) return null;
      const product = await res.json();
      const variant =
        (Array.isArray(product.variants) && product.variants.find(function (v) { return v && v.available; })) ||
        (Array.isArray(product.variants) ? product.variants[0] : null);

      return {
        handle: product.handle || handle,
        productId: product.id || null,
        variantId: variant ? variant.id : null,
        title: product.title || null,
        sku: variant ? variant.sku || null : null,
        vendor: product.vendor || null,
        image: product.featured_image || null,
        price:
          variant && typeof variant.price !== 'undefined'
            ? String((Number(variant.price) / 100).toFixed(2)).replace(/\.00$/, '')
            : null,
      };
    } catch (_) {
      return null;
    }
  }

  /** Populate product info bar if present in section */
  function populateProductInfoBar(sectionEl, productData) {
    const infoBar = sectionEl.querySelector('.product-info-bar');
    if (!infoBar) return;

    if (!(productData && (productData.title || productData.handle))) {
      infoBar.style.display = 'none';
      return;
    }

    const title = productData.title || productData.handle || 'Custom Product';
    const productLink = productData.handle ? '/products/' + productData.handle : '/collections/all';

    infoBar.style.display = 'flex';
    infoBar.innerHTML =
      (productData.image
        ? '<img class="product-info-bar__image" src="' +
          productData.image +
          '" alt="' +
          title.replace(/"/g, '&quot;') +
          '" width="64" height="64">'
        : '') +
      '<div class="product-info-bar__details">' +
      '<h2 class="product-info-bar__title">' +
      title +
      '</h2>' +
      '</div>' +
      (productData.price ? '<div class="product-info-bar__price">$' + productData.price + '</div>' : '') +
      '<div class="product-info-bar__actions">' +
      '<button type="button" class="btn-configurator btn-configurator--primary btn-add-to-cart" data-variant-id="' +
      (productData.variantId || '') +
      '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
      '<span class="btn-add-to-cart__text">Add to Cart</span>' +
      '<svg class="btn-add-to-cart__spinner hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>' +
      '</button>' +
      '<a href="' +
      productLink +
      '" class="btn-configurator btn-configurator--secondary">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
      ' Back</a>' +
      '</div>';
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

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/%20/g, ' ')
      .replace(/[_/]+/g, ' ')
      .replace(/[^a-z0-9+ -]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function scoreTextMatch(haystack, needle) {
    if (!haystack || !needle) return 0;
    if (haystack === needle) return 500;
    if (haystack.indexOf(needle) >= 0) return 250;

    const haystackTokens = new Set(haystack.split(' '));
    return needle.split(' ').reduce(function (score, token) {
      if (!token || token.length < 2) return score;
      if (haystackTokens.has(token)) {
        return score + token.length * 8 + (/\d/.test(token) ? 60 : 0);
      }
      if (/\d/.test(token)) return score - 25;
      return score;
    }, 0);
  }

  function parseQuantityRange(rawValue, allowExact) {
    const value = String(rawValue || '').toLowerCase().replace(/,/g, '').trim();
    const rangeMatch = value.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (rangeMatch) {
      const minQty = parseInt(rangeMatch[1], 10);
      const maxQty = parseInt(rangeMatch[2], 10);
      if (isFinite(minQty) && isFinite(maxQty)) {
        return { label: minQty + '-' + maxQty, minQty: minQty, maxQty: maxQty };
      }
    }

    const plusMatch = value.match(/(\d+)(?:\s*[a-z]+)*\s*\+/);
    if (plusMatch) {
      const minQty = parseInt(plusMatch[1], 10);
      if (isFinite(minQty)) {
        return { label: minQty + '+', minQty: minQty, maxQty: null };
      }
    }

    if (allowExact) {
      const exactMatch = value.match(/^(\d+)(?:\s*[a-z]+)*$/);
      if (exactMatch) {
        const exactQty = parseInt(exactMatch[1], 10);
        if (isFinite(exactQty)) {
          return { label: String(exactQty), minQty: exactQty, maxQty: exactQty };
        }
      }
    }

    return null;
  }

  function pickVariantForColor(variants, selectedColor) {
    if (!Array.isArray(variants) || variants.length === 0) return null;

    const colorNeedle = normalizeText(selectedColor);
    if (!colorNeedle) {
      return variants.find(function (variant) { return variant && variant.available; }) || variants[0] || null;
    }

    let bestVariant = variants[0] || null;
    let bestScore = -Infinity;

    variants.forEach(function (variant) {
      if (!variant) return;
      const optionText = [variant.option1, variant.option2, variant.option3].filter(Boolean).join(' ');
      const searchText = normalizeText((variant.title || '') + ' ' + optionText);
      const score = scoreTextMatch(searchText, colorNeedle);
      if (score > bestScore) {
        bestScore = score;
        bestVariant = variant;
      }
    });

    return bestVariant;
  }

  function extractQuantityTier(variant) {
    if (!variant) return null;

    const titleRange = parseQuantityRange(variant.title, false);
    if (!titleRange) return null;

    return {
      label: titleRange.label,
      minQty: titleRange.minQty,
      maxQty: titleRange.maxQty,
      unitPrice: Number(variant.price || 0) / 100,
      compareAtPrice: variant.compare_at_price ? Number(variant.compare_at_price) / 100 : null,
      variantId: parseVariantId(variant.id),
    };
  }

  function parseJsonValue(rawValue) {
    if (rawValue == null || rawValue === '') return null;

    if (Array.isArray(rawValue) || (typeof rawValue === 'object' && rawValue !== null)) {
      return rawValue;
    }

    try {
      return JSON.parse(rawValue);
    } catch (_) {
      return null;
    }
  }

  function normalizeStringList(rawValue) {
    if (rawValue == null || rawValue === '') return null;

    const parsed = parseJsonValue(rawValue);
    if (Array.isArray(parsed)) {
      const values = parsed
        .map(function (item) { return item == null ? '' : String(item).trim(); })
        .filter(Boolean);
      return values.length ? values : null;
    }

    if (typeof parsed === 'string') {
      return normalizeStringList(parsed);
    }

    const fallback = String(rawValue)
      .split(/\r?\n|[,;|]/)
      .map(function (item) { return item.trim(); })
      .filter(Boolean);

    return fallback.length ? fallback : null;
  }

  function buildCustomTableRows(qtyTable, priceTable, unitTable) {
    const qtyValues = normalizeStringList(qtyTable);
    const priceValues = normalizeStringList(priceTable);
    const unitValues = normalizeStringList(unitTable);

    if (!(qtyValues && priceValues && unitValues)) return [];

    const rowCount = Math.min(qtyValues.length, priceValues.length, unitValues.length);
    return Array.from({ length: rowCount }, function (_, index) {
      return {
        quantity: qtyValues[index] || '',
        pricePerCase: priceValues[index] || '',
        pricePerPiece: unitValues[index] || '',
      };
    }).filter(function (row) {
      return row.quantity || row.pricePerCase || row.pricePerPiece;
    });
  }

  function parseMoneyValue(rawValue) {
    if (typeof rawValue === 'number') {
      return isFinite(rawValue) ? rawValue : null;
    }

    if (typeof rawValue !== 'string') return null;

    const normalized = rawValue.replace(/[^0-9.-]+/g, '');
    if (!normalized) return null;

    const parsed = parseFloat(normalized);
    return isFinite(parsed) ? parsed : null;
  }

  function buildCustomPricingTiers(rows, fallbackVariantId) {
    return rows
      .map(function (row) {
        const parsedRange = parseQuantityRange(row.quantity, true);
        const pricePerCase = parseMoneyValue(row.pricePerCase);
        const pricePerPiece = parseMoneyValue(row.pricePerPiece);

        if (!parsedRange || pricePerCase === null) return null;

        return {
          label: parsedRange.label,
          minQty: parsedRange.minQty,
          maxQty: parsedRange.maxQty,
          unitPrice: pricePerCase,
          pricePerPiece: pricePerPiece,
          compareAtPrice: null,
          variantId: fallbackVariantId || null,
        };
      })
      .filter(Boolean)
      .sort(function (left, right) {
        return (left.minQty || 0) - (right.minQty || 0);
      });
  }

  async function buildThemePricingResponse(productData, selectedColor) {
    if (!productData || !productData.handle) return null;

    const res = await fetch('/products/' + encodeURIComponent(productData.handle) + '.js', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return null;
    const product = await res.json();
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const preferredVariant = pickVariantForColor(variants, selectedColor);
    const customTable = buildCustomTableRows(productData.qtyTable, productData.priceTable, productData.unitTable);
    const customPricingTiers = buildCustomPricingTiers(
      customTable,
      parseVariantId((preferredVariant && preferredVariant.id) || productData.variantId)
    );
    const quantityTiers = variants
      .map(extractQuantityTier)
      .filter(Boolean)
      .sort(function (left, right) {
        return (left.minQty || 0) - (right.minQty || 0);
      });

    const fallbackTier = preferredVariant
      ? {
          label: 'Standard price',
          minQty: 1,
          maxQty: null,
          unitPrice: Number(preferredVariant.price || 0) / 100,
          compareAtPrice: preferredVariant.compare_at_price ? Number(preferredVariant.compare_at_price) / 100 : null,
          variantId: parseVariantId(preferredVariant.id),
        }
      : null;

    const resolvedTier = customPricingTiers.length > 0
      ? customPricingTiers
      : quantityTiers.length > 0
        ? quantityTiers
        : fallbackTier ? [fallbackTier] : [];

    return {
      currencyCode: (product.currency || 'USD').toUpperCase(),
      product: {
        handle: product.handle || productData.handle || 'custom-product',
        title: product.title || productData.title || 'Custom Product',
      },
      tiers: resolvedTier,
      shopifyLive: resolvedTier.length > 0,
      message:
        resolvedTier.length > 0
          ? 'Pricing loaded from Shopify storefront context.'
          : 'No storefront pricing is available for this product yet.',
      customTable: customTable.length ? customTable : null,
      metafields: {
        qtyTable: customTable.length ? customTable.map(function (row) { return row.quantity; }) : normalizeStringList(productData.qtyTable),
        priceTable: customTable.length ? customTable.map(function (row) { return row.pricePerCase; }) : normalizeStringList(productData.priceTable),
        unitTable: customTable.length ? customTable.map(function (row) { return row.pricePerPiece; }) : normalizeStringList(productData.unitTable),
      },
    };
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
  async function initConfigurator(sectionEl) {
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
      productData.title     = urlParams.get('title');
      productData.sku       = urlParams.get('sku');
      productData.vendor    = urlParams.get('vendor');
      productData.image     = urlParams.get('image');
      productData.price     = urlParams.get('price');
      productData.qtyTable  = urlParams.get('qty_table');
      productData.priceTable = urlParams.get('price_table');
      productData.unitTable = urlParams.get('unit_table');
    }

    // If only partial product data is available, hydrate from Shopify by handle.
    if (
      productData.handle &&
      (!productData.title || !productData.productId || !productData.variantId || !productData.image)
    ) {
      const hydratedProduct = await fetchProductByHandle(productData.handle);
      if (hydratedProduct) {
        productData = Object.assign({}, hydratedProduct, productData);
        productData.title = productData.title || hydratedProduct.title;
        productData.productId = productData.productId || hydratedProduct.productId;
        productData.variantId = productData.variantId || hydratedProduct.variantId;
        productData.sku = productData.sku || hydratedProduct.sku;
        productData.vendor = productData.vendor || hydratedProduct.vendor;
        productData.image = productData.image || hydratedProduct.image;
        productData.price = productData.price || hydratedProduct.price;
      }
    }

    populateProductInfoBar(sectionEl, productData);

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
          quantity: parseInt(addToCartBtn.getAttribute('data-quantity'), 10) || 1,
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

      /* ─── Update Pricing from Iframe ─── */
      if (type === 'updatePricing') {
        const { variantId, quantity, subtotal } = event.data;
        
        // 1. Update Variant ID & Quantity on the "Add to Cart" button
        const addToCartBtn = sectionEl.querySelector('.btn-add-to-cart');
        if (addToCartBtn && variantId) {
          addToCartBtn.setAttribute('data-variant-id', variantId);
          addToCartBtn.setAttribute('data-quantity', quantity || 1);
        }

        // 2. Update the visual price text to show the subtotal
        const priceEl = sectionEl.querySelector('.product-info-bar__price');
        if (priceEl && subtotal !== undefined) {
          priceEl.textContent = '$' + subtotal.toFixed(2);
        }
      }

      /* ─── Pricing Request from Iframe (no Storefront token mode) ─── */
      if (type === 'requestThemePricing') {
        try {
          const payload = await buildThemePricingResponse(productData, event.data.selectedColor || null);
          event.source.postMessage(
            {
              type: 'themePricingResponse',
              requestId: event.data.requestId || null,
              pricing: payload,
            },
            '*'
          );
        } catch (err) {
          event.source.postMessage(
            {
              type: 'themePricingError',
              requestId: event.data.requestId || null,
              error: err && err.message ? err.message : 'Unable to read storefront pricing.',
            },
            '*'
          );
        }
      }

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
