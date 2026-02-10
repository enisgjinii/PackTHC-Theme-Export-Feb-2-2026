/**
 * Product page
 *
 * @package Dev
 */

'use strict';
// Set height item.
function adjustSlideHeights(doc = document) {
	function setThumbsSlideHeight() {
		var	mainSlide    = doc.querySelector( '.product-main-slide .swiper' ),
			thumbsSlides = doc.querySelectorAll( '.product-thumbs-slide .swiper' );

		if (mainSlide && thumbsSlides.length) {
			var mainSlideHeight = mainSlide.offsetHeight;

			thumbsSlides.forEach(thumbsSlide => {
				var items            = thumbsSlide.querySelectorAll( '.swiper-slide' ),
					totalItemsHeight = Array.from( items ).reduce( ( total, item ) => {
					return total + item.offsetHeight;
				}, 0);

				var wrapper = thumbsSlide.querySelector( '.swiper-wrapper' );
				if ( totalItemsHeight < mainSlideHeight ) {
					wrapper.style.setProperty( 'justify-content', 'center' );
				} else {
					wrapper.style.removeProperty( 'justify-content' );
				}
			});
		}
	}

	setTimeout( setThumbsSlideHeight, 100 );
	window.addEventListener( 'resize', setThumbsSlideHeight );
}

const btyGalleryInstances = {};

function btyProductGallery(doc = document) {
	let gallery      = doc.querySelector( '.gallery-media' ),
		mainSelector = gallery ? gallery.querySelectorAll( '.product-main-slide .swiper' ) : [];

	let mainHeight         = doc.querySelector( '.product-main-slide .main-item' )?.offsetHeight,
		productThumbsSlide = doc.querySelector( '.product-thumbs-slide' ),
		thumbItems         = doc.querySelectorAll( '.product-thumbs-slide .swiper-slide' ),
		thumbItemHeight    = thumbItems.length ? ( thumbItems[0].offsetHeight + 12 ) : 0,
		totalThumbHeight   = thumbItems.length * thumbItemHeight,
		slidesPerView      = Math.floor( ( mainHeight - 12 ) / thumbItemHeight );

	if ( productThumbsSlide ) {
		productThumbsSlide.style.setProperty( '--height', `${ mainHeight }px` );
	}

	if ( ! mainSelector.length || typeof Swiper === 'undefined' ) {
		return;
	}

	let initialSlide = 0,
		layout       = gallery.parentNode.getAttribute( 'data-id' );

	// Slide options.
	let btyThumbsSlideOptions = {};
	let btyMainSlideOptions   = {};
	const swiperSlides        = doc.querySelectorAll( '.product-main-slide .swiper-slide' );
	const swiperSlidesMain    = doc.querySelector( '.product-main-slide' );
	const swiperSlidesThumb   = doc.querySelector( '.product-thumbs-slide' );
	const numberOfSlides      = swiperSlides.length;

	// Set slider thumb height.
	if (swiperSlidesThumb) {
		swiperSlidesThumb.style.setProperty( '--main-height', `${ swiperSlidesMain.querySelector( '.main-item' ).offsetHeight }px` );
	}

	if ('layout-2' == layout) {
		if (numberOfSlides === 1) {
			btyMainSlideOptions = {
				allowTouchMove:true,
				slidesPerView: 1,
				spaceBetween: 12,
				speed: 600,
			};

			swiperSlidesMain.style.paddingLeft = '0';
			swiperSlidesMain.style.width       = '100%';
		} else if (numberOfSlides > 1) {
			btyThumbsSlideOptions = {
				direction: 'vertical',
				slidesPerView: 4,
				spaceBetween: 12,
				speed: 600,
				watchSlidesVisibility: true,
				watchSlidesProgress: true,
				navigation: {
					nextEl: ".thumb-next",
					prevEl: ".thumb-prev",
				},
				breakpoints: {
					240: {
						direction: 'horizontal',
						slidesPerView: 4,
						spaceBetween: 12
					},
					992: {
						slidesPerView: 5,
						direction: 'vertical'
					}
				}
			};

			btyMainSlideOptions = {
				slidesPerView: 1,
				spaceBetween: 12,
				allowTouchMove:true,
				speed: 600,
				navigation: {
					nextEl: ".main-next",
					prevEl: ".main-prev",
				},
				thumbs: {
					swiper: new Swiper( '.product-thumbs-slide' , btyThumbsSlideOptions )
				}
			};
		}
	} else if ('layout-1' == layout) {
		if (numberOfSlides === 1) {
			btyMainSlideOptions = {
				allowTouchMove:true,
				slidesPerView: 1,
				spaceBetween: 12,
				speed: 600
			};
		} else if (numberOfSlides > 1) {
			btyMainSlideOptions = {
				allowTouchMove:true,
				slidesPerView: 2,
				spaceBetween: 12,
				speed: 600
			};
		}
	}

	// Set center slides for Thumbs, 132 = item_width + margin right.
	let thumbsSelector = gallery.querySelectorAll( '.product-thumbs-slide .swiper' );
	if ( thumbsSelector.length ) {
		thumbsSelector.forEach( function ( el ) {
			let thumbItems = el.querySelectorAll( '.thumb-item' ).length;
			if (thumbItems > 0 && el.offsetWidth > thumbItems * 132) {
				el.classList.add( 'center-slides' );
			}
		});
	}

	// Get slide init index.
	let selectedProduct = btyProductVariants( doc, true );

	mainSelector.forEach( function ( el, index ) {
		if ( el.classList.contains( 'swiper-initialized' ) ) {
			return;
		}

		let groupImage = el.parentNode.classList.contains( 'check-group-image' );

		btyMainSlideOptions.navigation = {
			nextEl: el.querySelector( '.product-main-slide .swiper-button-next' ),
			prevEl: el.querySelector( '.product-main-slide .swiper-button-prev' )
		};

		// Custom pagination.
		btyMainSlideOptions.pagination = {
			el: el.querySelector( '.swiper-pagination' ),
			type: 'custom',
			renderCustom: function (swiper, current, total) {
				return current + '/' + total;
			}
		};

		// Thumbs slide.
		if ( thumbsSelector.length && ! thumbsSelector[index].classList.contains( 'swiper-initialized' ) ) {
			const btyThumbsSlider      = new Swiper( thumbsSelector[index], btyThumbsSlideOptions );
			btyMainSlideOptions.thumbs = {
				swiper: btyThumbsSlider
			};

			// Connect click navigation thumb slider to main slider.
			btyThumbsSlider.on( 'slideChange' , function () {
				btyGalleryInstances[index].slideTo( btyThumbsSlider.activeIndex );
			});
		}

		// Set start slide.
		if ( ! groupImage) {
			btyMainSlideOptions.initialSlide = initialSlide;
		}

		// Main slide.
		btyGalleryInstances[index] = new Swiper( el, btyMainSlideOptions );

		// Check Product-model.
		btyGalleryInstances[index].on('slideChange', function () {
			let mainSwiper      = btyGalleryInstances[index],
				activeIndex     = mainSwiper.realIndex,
				activeSlide     = mainSwiper.slides[activeIndex],
				hasProductModel = activeSlide && activeSlide.querySelector( '.product-model' ),
				allowTouchMove  = ! hasProductModel;

			mainSwiper.allowTouchMove = allowTouchMove;
		});

		btyGalleryInstances[index].on( 'touchMove', function ( swiper, event ) {
			if ( ! swiper.allowTouchMove ) {
				event.preventDefault();
			}
		});

		// Product variant updated event.
		doc.addEventListener( 'product-variant-updated' , function ( e ) {
			if ( ! e.detail.selected || groupImage || ! e.detail.selected.featured_media ) {
				return;
			}

			btyGalleryInstances[index].slideTo( e.detail.selected.featured_media.position - 1, 600 );
		});

		// Product current lightbox updated event.
		doc.addEventListener( 'product-variant-updated', function ( e ) {
			if ( ! e.detail.selected || ! e.detail.selected.featured_media || ! btyGalleryInstances[index] ) {
				return;
			}

			let targetIndex = e.detail.selected.featured_media.position ? e.detail.selected.featured_media.position - 1 : 0;
			btyGalleryInstances[index].slideTo( targetIndex, 600 );
		});


		// Autoplay video.
		btyGalleryInstances[index].on( 'slideChange' , function ( swp ) {
			btyMediaAction();

			let nthChild      = swp.realIndex + 1,
				mediaTemplate = swp.el.querySelector( '.main-item:nth-child(' + nthChild + ')' );
			if ( mediaTemplate ) {
				setTimeout( function () {
					btyLoadMedia( mediaTemplate, 'play' );
				});
			}
		});
	});
}

// Photoswipe handle.
function btyPhotoswipeHandle( doc = document ) {
	// parse slide data (url, title, dimension ...) from DOM elements (children of gallerySelector).
	let parseThumbnailElements = function ( el ) {

	let thumbElements = el.querySelectorAll( '.product-main-slide .media-preview-wrap' ),
		items         = [],
		wrapEl, dimension, item;

		if ( ! thumbElements.length ) {
			return;
		}

		for ( let i = 0, ij = thumbElements.length; i < ij; i++ ) {
			wrapEl = thumbElements[ i ];

			// include only element nodes.
			if ( 'BUTTON' !== wrapEl.tagName ) {
				continue;
			}

			dimension = wrapEl.getAttribute( 'data-dimension' );
			if ( ! dimension ) {
				continue;
			}

			dimension = dimension.split( 'x' );

			// create slide object.
			item = {
				src: wrapEl.getAttribute( 'data-zoom' ),
				w: parseInt( dimension[0], 10 ),
				h: parseInt( dimension[1], 10 ),
				index: i
			};

			if ( wrapEl.children.length > 0 ) {
				// <img> thumbnail element, retrieving thumbnail url.
				item.msrc = wrapEl.children[0].getAttribute( 'src' );
			}

			item.el = wrapEl; // save link to element for getThumbBoundsFn.
			items.push( item );
		}

		return items;
	};

	// find nearest parent element.
	let closest = function closest( el, fn ) {
		return el && ( fn( el )?el : closest( el.parentNode, fn ) );
	};

	// triggers when user clicks on thumbnail.
	let onThumbnailsClick = function ( e ) {
		e = e || window.event;
		e.preventDefault?e.preventDefault() : e.returnValue = false;

		let eTarget = e.target || e.srcElement;

		// find root element of slide.
		let clickedListItem = closest(
			eTarget,
			function ( el ) {
				return ( el.tagName && 'BUTTON' === el.tagName );
			}
		);

		if ( ! clickedListItem ) {
			return;
		}

		// find index of clicked item by looping through all child nodes
		// alternatively, you may define index via data- attribute.
		let clickedGallery = clickedListItem.parentNode.parentNode,
			childNodes     = clickedGallery.childNodes,
			nodeIndex      = 0,
			index;

		for ( let i = 0, j = childNodes.length; i < j; i++ ) {
			if ( childNodes[ i ].nodeType !== 1 ) {
				continue;
			}

			if ( ! childNodes[ i ].querySelector( '[data-dimension]' ) ) {
				continue;
			}

			if ( childNodes[ i ] === clickedListItem.parentNode ) {
				index = nodeIndex;
				break;
			}
			nodeIndex++;
		}

		if ( index >= 0 ) {
			// open PhotoSwipe if valid index found.
			openPhotoSwipe( index, clickedGallery );
		}

		return false;
	};

	// parse picture index and gallery index from URL (#&pid=1&gid=2).
	let photoswipeParseHash = function () {
		let hash   = window.location.hash.substring( 1 ),
			params = {};

		if ( hash.length < 5 ) {
			return params;
		}

		let vars = hash.split( '&' );
		for ( let i = 0, ij = vars.length; i < ij; i++ ) {
			if ( ! vars[ i ] ) {
				continue;
			}
			let pair = vars[ i ].split( '=' );
			if ( pair.length < 2 ) {
				continue;
			}
			params[ pair[0] ] = pair[1];
		}

		if ( params.gid ) {
			params.gid = parseInt( params.gid, 10 );
		}

		return params;
	};

	// open photoswipe.
	let openPhotoSwipe = function ( index, galleryElement, disableAnimation, fromURL ) {
		let pswpElement = doc.querySelector( '.pswp' ),
			gallery,
			options,
			items;

		items = parseThumbnailElements( galleryElement );

		// define options (if needed).
		options = {
			// define gallery index (for URL).
			galleryUID: galleryElement.getAttribute( 'data-pswp-uid' ),
			getThumbBoundsFn: function ( index ) {
				// See Options -> getThumbBoundsFn section of documentation for more info.
				let thumbnail   = items[ index ].el.querySelector( 'img' ), // find thumbnail.
					pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
					rect        = thumbnail.getBoundingClientRect();

				return {
					x: rect.left,
					y: rect.top + pageYScroll,
					w: rect.width
				};
			}
		};

		// PhotoSwipe opened from URL.
		if ( fromURL ) {
			if ( options.galleryPIDs ) {
				// parse real index when custom PIDs are used
				// http://photoswipe.com/documentation/faq.html#custom-pid-in-url.
				for ( let j = 0, ji = items.length; j < ji; j++ ) {
					if ( items[ j ].pid == index ) {
						options.index = j;
						break;
					}
				}
			} else {
				// in URL indexes start from 1.
				options.index = parseInt( index, 10 ) - 1;
			}
		} else {
			options.index = parseInt( index, 10 );
		}

		// exit if index not found.
		if ( isNaN( options.index ) ) {
			return;
		}

		if ( disableAnimation ) {
			options.showAnimationDuration = 0;
		}

		// Pass data to PhotoSwipe and initialize it.
		gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options );
		gallery.init();

		// Update current slide for Swiper.
		gallery.listen(
			'afterChange',
			function ( e ) {
				document.dispatchEvent( new CustomEvent( 'lightbox-product-updatedupdated', { detail: { index: gallery.items[ gallery.getCurrentIndex() ].index } } ) );
			}
		);
	};

	// loop through all gallery elements and bind events.
	let galleryElements = doc.querySelectorAll( '.product-main-slide' );
	if ( galleryElements.length ) {
		for ( let i = 0, l = galleryElements.length; i < l; i++ ) {
			galleryElements[ i ].setAttribute( 'data-pswp-uid', i + 1 );
			galleryElements[ i ].onclick = onThumbnailsClick;
		};

		// Parse URL and open gallery if it contains #&pid=3&gid=1.
		let hashData = photoswipeParseHash();
		if ( hashData.pid && hashData.gid ) {
			openPhotoSwipe( hashData.pid, galleryElements[ hashData.gid - 1 ], true, true );
		};
	}
}

// Detect model exit.
function btyModelExit() {
	document.addEventListener(
		'click',
		function ( e ) {
			let el   = e.target,
				node = document.querySelector( '.product-main-slide' )?'.product-main-slide' : '.single-media';

			if ( ! el.closest( node ) ) {
				btyMediaAction();
			}
		}
	);
}

// Product model html structure.
customElements.define(
	'product-model',
	class ProductModel extends HTMLElement {
	constructor() {
		super();

		const poster = this.querySelector( '[id^="deferred-poster-"]' );
		if ( ! poster ) {
			return;
		}

		poster.addEventListener( 'click', this.loadContent.bind( this ) );
	}

	loadContent() {
		if ( ! this.getAttribute( 'loaded' ) ) {
			const template = this.querySelector( 'template' );

			if ( ! template || ! template.content.firstElementChild ) {
					return;
			}

			const content = document.createElement( 'div' );
			content.appendChild( template.content.firstElementChild.cloneNode( true ) );

			this.setAttribute( 'loaded', true );

			const deferredElement = this.appendChild( content.querySelector( 'model-viewer' ) );
		}


		Shopify.loadFeatures(
			[
				{
					name: 'model-viewer-ui',
					version: '1.0',
					onLoad: this.setupModelViewerUI.bind( this )
				}
			]
		);
	}

	setupModelViewerUI( errors ) {
		if ( errors ) {
			return;
		}

		this.modelViewerUI = new Shopify.ModelViewerUI( this.querySelector( 'model-viewer' ) );
	}
	}
);

// Product model setup.
window.ProductModel = {
	loadShopifyXR() {
		Shopify.loadFeatures(
			[
				{
					name: 'shopify-xr',
					version: '1.0',
					onLoad: this.setupShopifyXR.bind( this )
				}
			]
		);
	},
	setupShopifyXR( errors ) {
		if ( errors ) {
			return;
		}

		if ( ! window.ShopifyXR ) {
			document.addEventListener( 'shopify_xr_initialized', () => this.setupShopifyXR() );

			return;
		}

		let modelConfig = document.getElementById( 'product-model-config' );
		if ( ! modelConfig ) {
			return;
		}

		window.ShopifyXR.addModels( JSON.parse( modelConfig.textContent ) );
		window.ShopifyXR.setupXRElements();

		modelConfig.remove();
	}
};

// Toggle modal.
function btyToggleModal( doc = document ) {
	let selectors = doc.querySelectorAll( '.modal-toggle-button' ),
		modal     = doc.querySelector( '.product-modal' ),
		close     = modal ? modal.querySelector( '.media-modal-toggle' ) : false;
	if ( ! selectors.length || ! close ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			el.onclick = function () {
				modal.classList.add( 'is-open' );

				let item = modal.querySelector( '[data-media-id="' + el.parentNode.getAttribute( 'data-media-id' ) + '"]' );
				if ( ! item ) {
					return;
				}

				document.documentElement.classList.add( 'overflow-hidden' );
				item.classList.add( 'active' );
			}
		}
	);

	close.onclick = function () {
		let modalActive = modal.querySelector( '.product-model.active' );
		if ( modalActive ) {
			modalActive.classList.remove( 'active' );
		}

		modal.classList.remove( 'is-open' );
		document.documentElement.classList.remove( 'overflow-hidden' );
	}
}

// Sticky add to cart.
function btyStickyAddToCart( doc = document ) {
	let selector = doc.querySelector( '.sticky-add-to-cart' );
	if ( ! selector ) {
		return;
	}

	let image        = selector.querySelector( '.sticky-product-image' ),
		price        = selector.querySelector( '.product-price' ),
		form         = selector.querySelector( '[data-type="add-to-cart-form"]' ),
		formSummary  = selector.closest( '.shopify-section' ).querySelector( '.summary-item .product-buy' ),
		productId    = selector.querySelector( '[name="id"]' ),
		button       = selector.querySelector( '[name="add"]' ),
		qtyInput     = selector.querySelector( '.quantity-input' ),
		variants     = selector.closest( '.shopify-section' ).querySelector( '[data-product-variants]' ),
		quantity     = selector.closest( '.shopify-section' ).querySelector( '[data-inventory-quantity]' ),
		field        = selector.querySelectorAll( '.field-value' ),
		variant_pick = {};

	variants = variants ? btyJsonParse( variants.textContent ) : false;
	quantity = quantity ? btyJsonParse( quantity.textContent ) : false;

	if ( field.length ) {
		field.forEach(
			function ( el ) {
				variant_pick[ el.name ] = el.value;

				el.onchange = function () {
					variant_pick[ el.name ] = el.value;

					let selected = variants ? btySelectedVariant( variant_pick, variants ) : false;
					if ( selected ) {
						// Update product variant ID.
						if ( productId ) {
							productId.value = selected.id;
						}

						// Update image on Featured product.
						if ( image && selected.featured_image ) {
							btyImageLoad( image, selected.featured_image.src, selected.featured_media.id, image.parentNode );
						}

						// Update price.
						if ( price ) {
							price.innerHTML = btyPriceHtml( selected.price, selected.compare_at_price, selected.unit_price, selected.unit_price_measurement );
						}

						// Set max quantity.
						if ( qtyInput ) {
							let max = quantity ? quantity.filter(
								function ( e ) {
									return e.id === selected.id;
								}
							) : [];

							if ( max.length ) {
								let qty = max[0].qty;

								if ( qty > 0 ) {
									if ( Number( qtyInput.value ) > qty ) {
										qtyInput.value = qty;
									}

									qtyInput.setAttribute( 'max', qty );
								} else {
									qtyInput.removeAttribute( 'max' );
								}
							} else {
								qtyInput.removeAttribute( 'max' );
							}
						}
					}

					// Update add to cart button text.
					if ( button ) {
						if ( selected ) {
							if ( selected.available ) {
								button.innerHTML = btyStrings.product.add_to_cart;
								button.classList.remove( 'disabled' );
							} else {
								button.innerHTML = btyStrings.product.out_of_stock;
								button.classList.add( 'disabled' );
							}
						} else {
							button.classList.add( 'disabled' );
							button.innerHTML = btyStrings.product.unavailable;
						}
					}
				}
			}
		);
	}

	// Scroll to show.
	let summaryAddToCart = doc.querySelector( '.summary-item.add-to-cart' );
	if ( ! summaryAddToCart ) {
		return;
	}

	// Scroll to add to cart.
	const scrollToAddToCart = function () {
		button.addEventListener(
			'click',
			function () {
				if ( window.matchMedia( '(min-width: 768px)' ).matches || ! button.classList.contains( 'add-product-variants' ) || ! formSummary ) {
					return;
				}

				formSummary.scrollIntoView( { behavior: 'smooth', block: 'end', inline: 'end' } );
			}
		);
	}
	scrollToAddToCart();

	const observerSummaryAddToCart = new IntersectionObserver(
		function ( entries ) {
			window.addEventListener(
				'resize',
				function () {
					scrollToAddToCart();
				}
			);

			if ( entries[0].intersectionRatio <= 0 ) {
				selector.classList.add( 'active' );
			} else {
				selector.classList.remove( 'active' );
			}
		}
	);

	observerSummaryAddToCart.observe( summaryAddToCart );
}

// Product recommendations.
function btyProductPerformed( doc = document ) {
	let selector = doc.querySelectorAll( '.product-performed [data-source]' );
	if ( ! selector.length ) {
		return;
	}

	selector.forEach(
		function ( el ) {
			let url = el.getAttribute( 'data-url' );
			if ( el.innerHTML.trim() || ! url ) {
				return;
			}

			fetch( url )
				.then(
					function ( r ) {
						if ( 200 !== r.status ) {
							console.log( 'Status Code: ' + r.status );
							throw r;
						}

						return r.text();
					}
				).then(
					function ( res ) {
						el.innerHTML = btyGetSectionHtml( res, '[data-source]' );
						el.removeAttribute( 'data-url' );

						btyAddToCart( el );
						btyQuickView( el );
						btySwatch( el );
						btyAnimationImageLoad( el );
						btyHoverMediaVideo( el );
						btyQuickAdd( el );
						btyCarousel( el );
						btyScrollAnimationTrigger( el );

						// Fire when product card updated.
						document.dispatchEvent( new CustomEvent( 'product-card-updated' ) );
					}
				).catch(
					function ( err ) {
						console.log( err );
					}
				);
		}
	);
}

// Block complementary products.
function btyComplementaryProducts( doc = document ) {
	let selector = doc.querySelector( '.complementary-products-container' );
	if ( ! selector ) {
		return;
	}

	let url = selector.getAttribute( 'data-url' );

	if ( selector.innerHTML.trim() || ! url ) {
		return;
	}

	fetch( url )
		.then(
			function ( r ) {
				if ( 200 !== r.status ) {
					console.log( 'Status Code: ' + r.status );
					throw r;
				}

				return r.text();
			}
		).then(
			function ( res ) {
				selector.innerHTML = btyGetSectionHtml( res, '.complementary-products-container' );

				btyQuickView( selector );
				btyCarousel( selector );
				btyAnimationImageLoad( selector );
				btyAddToCart( selector );
				btyAccordionHandle( selector );
			}
		).catch(
			function ( err ) {
				console.log( err );
			}
		);
}

// HandleEmailInputState.
function handleEmailInputState(doc = document) {
	let emailInput      = doc.querySelector( ".email-input" ),
		addToCartButton = doc.querySelector( ".add-to-cart-button" ),
		errorMessage    = doc.querySelector( ".error-messages" );

	if ( ! emailInput || ! addToCartButton) {
		return;
	}

	function isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test( email );
	}

	function toggleButtonState() {
		addToCartButton.disabled = emailInput.value.trim() === "";

		if ( errorMessage ) {
			errorMessage.textContent = "";
		}
	}

	function handleAddToCartClick() {
		let emailValue          = emailInput.value.trim(),
			invalidEmailMessage = emailInput.dataset.emailRequired;

		if ( ! isValidEmail( emailValue )) {
			if (errorMessage) {
				errorMessage.textContent = invalidEmailMessage;
			}
		} else {
			if (errorMessage) {
				errorMessage.textContent = "";
			}
		}
	}

	toggleButtonState();

	emailInput.addEventListener( "input", toggleButtonState );
	addToCartButton.addEventListener( "click", handleAddToCartClick );
}

document.addEventListener(
	'DOMContentLoaded',
	function () {
		if ( window.ProductModel ) {
			window.ProductModel.loadShopifyXR();
		}
		btyStickyAddToCart();
		btyToggleModal();
		btyProductGallery();
		btyPhotoswipeHandle();
		btyProductPerformed();
		btyComplementaryProducts();
		adjustSlideHeights();
		handleEmailInputState();

		window.addEventListener(
			'resize',
			function () {
				btyProductGallery();
				handleEmailInputState();
			}
		);
	}
);

document.addEventListener(
	'shopify:section:load',
	function ( e ) {
		let section = e.target.closest( 'section.shopify-section' );
		btyProductPerformed( section );
		btyComplementaryProducts( section );
		adjustSlideHeights( section );
		btyProductGallery();
		handleEmailInputState();
	}
);

document.addEventListener(
	'shopify:section:select',
	function ( e ) {
		let section = e.target;
		btyProductGallery( section );
		btyPhotoswipeHandle( section );
		btyProductPerformed( section );
		btyStickyAddToCart( section );
		btyComplementaryProducts( section );
		adjustSlideHeights( section );
		handleEmailInputState( section );
	}
);

document.addEventListener(
	'shopify:block:select',
	function ( e ) {
		let section = e.target.closest( '.shopify-section' );
		if ( ! section ) {
			return;
		}
		btySlider( section, e );
		btyProductGallery( section );
		btyPhotoswipeHandle( section );
		btyStickyAddToCart( section );
		btyComplementaryProducts( section );
		adjustSlideHeights( section, e );
		handleEmailInputState( section );
	}
);




