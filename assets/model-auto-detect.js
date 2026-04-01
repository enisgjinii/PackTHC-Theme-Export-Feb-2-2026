/**
 * PackTHC – 3D Model Auto-Detect
 * Checks whether the current product has a matching 3D model by fetching the
 * models manifest (static JSON) and scoring locally. Shows the "Customize in 3D"
 * button only when a real model match is found; hides it otherwise.
 *
 * Usage: loaded on product pages via the customize-3d-button snippet.
 */
(function () {
  'use strict';

  /* ─── Config ─── */
  var CONFIGURATOR_BASE = (
    window.__PACKTHC_CONFIGURATOR_URL__ ||
    'https://v0-product-design-tool.vercel.app'
  ).replace(/\/$/, '');
  var MANIFEST_URL = CONFIGURATOR_BASE + '/models-manifest.json';
  var CACHE_KEY = 'packthc_3d_model_match_v4';
  var MANIFEST_CACHE_KEY = 'packthc_3d_manifest_v1';
  var CACHE_TTL = 1000 * 60 * 60;       // 1 hour for match results
  var MANIFEST_TTL = 1000 * 60 * 60 * 6; // 6 hours for manifest

  /* ─── Scoring (mirrors Next.js scoreModelMatch logic) ─── */
  var COLOR_TOKENS = ['black','white','clear','transparent','red','blue','green',
    'yellow','orange','purple','pink','gray','grey','gold','golden','amber','smoke','matte'];
  var KEYWORDS = [
    ['pop top',24],['poptop',24],['pre roll',12],['preroll',12],
    ['dram',10],['aviator',10],['unicorn',10],
    ['spiral',10],['sprial',10],['cartridge',10],
    ['dome',10],['pouch',10],['mylar',10],['grinder',10],['blunt',10],['acrylic',10]
  ];
  var MIN_SCORE = 20;

  /**
   * Gate check: the product must explicitly contain at least one keyword that
   * maps to an actual 3D model category in the manifest. Generic words like
   * "jar", "bottle", "tube", "plastic" alone are NOT enough — they appear in
   * too many products without 3D models and cause false positives.
   */
  var GATE_KEYWORDS = [
    'dram',       // X Dram containers
    'pop top', 'poptop',  // Pop Top Tubes/Vials
    'aviator',    // Aviator Bottles/Containers/Tubes
    'mylar',      // Mylar Bags
    'grinder',    // Grinders
    'unicorn',    // Unicorn Bottles
    'spiral', 'sprial',   // Spiral Containers/Bottles/Tubes
    'pouch',      // Pouch Containers
    // NOTE: 'preroll'/'pre roll' handled separately below — needs "pre rolled" exclusion
    'blunt',      // Blunt Tubes
    'acrylic',    // Acrylic Boxes
    'dome',       // Dome Jars
    'cartridge'   // Cartridge Containers
  ];

  /**
   * These products can NEVER have a 3D model in our catalog.
   * Checked before any gate keyword — disqualifier always wins.
   */
  var DISQUALIFIERS = [
    'paper cone', 'paper cones',        // rolling cones, not tubes
    'rice paper',                        // rolling papers
    'rolling paper', 'rolling papers',   // papers
    'hemp cone', 'hemp cones',           // natural leaf cones
    'king palm',                         // palm leaf products
    'blunt wrap', 'blunt wraps',         // blunt wraps (vs blunt TUBES which have models)
    'hemp wrap', 'hemp wraps',           // wrap products
    'wood tip', 'glass tip',             // accessories
    'filter tip', 'filter tips',         // paper accessories
  ];

  /**
   * Gate check: returns array of matched category keywords (non-empty = show button).
   * Empty array = product doesn't qualify → hide button.
   * Returning the matched keywords (not just true/false) lets findBestMatch restrict
   * scoring to only models in the same category, preventing cross-category false positives.
   */
  function passesGateCheck(query) {
    // 1. Disqualifiers win unconditionally — these are never 3D-model products.
    for (var d = 0; d < DISQUALIFIERS.length; d++) {
      if (query.indexOf(DISQUALIFIERS[d]) !== -1) return [];
    }

    var matched = [];
    for (var i = 0; i < GATE_KEYWORDS.length; i++) {
      if (query.indexOf(GATE_KEYWORDS[i]) !== -1) matched.push(GATE_KEYWORDS[i]);
    }

    // "preroll"/"pre roll" as TUBE products only.
    // Block when: past-tense "pre rolled" present (paper cones/joints),
    // OR "cone"/"cones" is in the query (paper cones called "Pre-Roll Cones").
    var hasCone = (query.indexOf(' cone') !== -1 || query.indexOf('cone ') !== -1);
    if (query.indexOf('preroll') !== -1 && query.indexOf('prerolled') === -1 && !hasCone) {
      matched.push('preroll');
    }
    if (query.indexOf('pre roll') !== -1 && query.indexOf('pre rolled') === -1 && !hasCone) {
      matched.push('pre roll');
    }

    // "jar" only qualifies when explicitly paired with "pet" (PET Jars in our catalog).
    // Plain "Plastic Jar", "Glass Jar", "Mason Jar" do NOT have 3D models.
    if (query.indexOf('jar') !== -1 && query.indexOf('pet') !== -1) matched.push('jar');

    return matched;
  }

  function normalizeText(v) {
    if (!v) return '';
    return v.toLowerCase()
      .replace(/%20/g,' ').replace(/[_/]+/g,' ')
      .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  }

  function scoreModel(query, model) {
    var modelText = normalizeText((model.name||'') + ' ' + (model.category||'') + ' ' + (model.path||''));
    if (!modelText) return -Infinity;
    var score = 0;
    var tokens = query.split(' ').filter(function(t){ return t.length > 1; });
    tokens.forEach(function(t){ if (modelText.indexOf(t) !== -1) score += t.length > 4 ? 4 : 3; });

    var mmM = query.match(/\b(\d{2,4})\s*mm\b/);
    if (mmM) {
      var sz = mmM[1];
      if (new RegExp('\\b' + sz + '\\s*mm\\b').test(modelText)) score += 80;
      else if (new RegExp('\\b' + sz + '\\b').test(modelText)) score += 30;
    }
    var drM = query.match(/\b(\d{1,3})\s*dram\b/);
    if (drM && new RegExp('\\b' + drM[1] + '\\s*dram\\b').test(modelText)) score += 70;

    var color = COLOR_TOKENS.filter(function(c){ return query.indexOf(c) !== -1; })[0];
    if (color) {
      if ((color === 'gold' && modelText.indexOf('golden') !== -1) ||
          (color === 'grey' && modelText.indexOf('gray') !== -1) ||
          modelText.indexOf(color) !== -1) score += 30;
    }
    KEYWORDS.forEach(function(kw){
      if (query.indexOf(kw[0]) !== -1 && modelText.indexOf(kw[0]) !== -1) score += kw[1];
    });
    return score;
  }

  function findBestMatch(models, query) {
    // Gate check returns which category keywords the product contains.
    // Empty array = no qualifying keyword → hide button immediately.
    var gateWords = passesGateCheck(query);
    if (gateWords.length === 0) {
      return { score: -Infinity, model: null, matched: false };
    }

    // Advanced filter: only score models that share at least one gate keyword
    // with the product. This ensures a "blunt" product only competes against
    // blunt-tube models, not pop-top or dram models that happened to share a
    // color or size, preventing cross-category false positives.
    var best = -Infinity, bestModel = null;
    for (var i = 0; i < models.length; i++) {
      var modelText = normalizeText((models[i].name||'') + ' ' + (models[i].category||'') + ' ' + (models[i].path||''));
      var modelSharesCategory = false;
      for (var g = 0; g < gateWords.length; g++) {
        if (modelText.indexOf(gateWords[g]) !== -1) { modelSharesCategory = true; break; }
      }
      if (!modelSharesCategory) continue; // skip unrelated model categories

      var s = scoreModel(query, models[i]);
      if (s > best) { best = s; bestModel = models[i]; }
    }
    return { score: best, model: bestModel, matched: best >= MIN_SCORE };
  }

  /* ─── Manifest cache ─── */
  function getCachedManifest() {
    try {
      var raw = sessionStorage.getItem(MANIFEST_CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj.ts > MANIFEST_TTL) { sessionStorage.removeItem(MANIFEST_CACHE_KEY); return null; }
      return obj.models;
    } catch(e){ return null; }
  }

  function setCachedManifest(models) {
    try { sessionStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify({ ts: Date.now(), models: models })); } catch(e){}
  }

  function getManifest() {
    var cached = getCachedManifest();
    if (cached) return Promise.resolve(cached);
    return fetch(MANIFEST_URL, { mode: 'cors' })
      .then(function(r){ return r.json(); })
      .then(function(data){
        var models = (data && Array.isArray(data.models)) ? data.models : [];
        setCachedManifest(models);
        return models;
      });
  }

  /* ─── Match result cache ─── */
  function getCachedResult(handle) {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY + '_' + handle);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj.ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY + '_' + handle); return null; }
      return obj.data;
    } catch(e){ return null; }
  }

  function setCachedResult(handle, data) {
    try { sessionStorage.setItem(CACHE_KEY + '_' + handle, JSON.stringify({ ts: Date.now(), data: data })); } catch(e){}
  }

  /* ─── DOM helpers ─── */
  function getWrapper() { return document.querySelector('[data-3d-autodetect]'); }

  function showWrapper(wrapper, category) {
    wrapper.style.display = '';
    if (category) wrapper.setAttribute('data-model-category', category);
    else wrapper.removeAttribute('data-model-category');
  }

  function hideWrapper(wrapper) { wrapper.style.display = 'none'; }

  /* ─── Product info helpers ─── */
  function getMetaProduct() {
    return (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) || null;
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

  function getProductSku(wrapper) { return wrapper.dataset.productSku || ''; }

  /* ─── Apply result ─── */
  function applyResult(wrapper, result) {
    if (result.matched) {
      showWrapper(wrapper, result.category || null);
      var link = wrapper.querySelector('.customize-3d-btn');
      if (link && result.category) {
        var href = link.getAttribute('href') || '';
        if (href.indexOf('model_category=') === -1) {
          var sep = href.indexOf('?') !== -1 ? '&' : '?';
          link.setAttribute('href', href + sep + 'model_category=' + encodeURIComponent(result.category));
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

    wrapper.style.display = 'none'; // hidden until confirmed match

    var handle = getProductHandle(wrapper);
    var title = getProductTitle(wrapper);
    var productType = getProductType(wrapper);
    var sku = getProductSku(wrapper);

    if (!handle && !title) return;

    var cached = getCachedResult(handle);
    if (cached !== null) { applyResult(wrapper, cached); return; }

    var query = normalizeText([title, handle.replace(/-/g,' '), productType, sku].filter(Boolean).join(' '));
    if (!query) return;

    getManifest()
      .then(function(models) {
        var result = findBestMatch(models, query);
        var data = { matched: result.matched, category: result.matched && result.model ? result.model.category : null };
        setCachedResult(handle, data);
        applyResult(wrapper, data);
      })
      .catch(function() {
        // Manifest fetch failed (offline / CORS issue) — fail open so we don't permanently hide the button.
        showWrapper(wrapper, null);
      });
  }

  /* ─── Init ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndReveal);
  } else {
    checkAndReveal();
  }
})();
