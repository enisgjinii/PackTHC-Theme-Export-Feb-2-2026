/**
 * Theme js
 *
 * @package Dev
 */

'use strict';

// Set scrollbar width.
function btyScrollBar( doc = document ) {
	let domId = document.getElementById( 'dynamic-variables-theme-css' );
	if ( ! domId ) {
		return;
	}

	let scrollbarWidth = window.innerWidth - document.body.clientWidth,
		megaMenu       = doc.querySelector( '.header-nav .mega-menu-wrap' ),
		currentWidth   = window.innerWidth - document.documentElement.clientWidth;

	// Custom event.
	const scrollbarEvent = new Event( 'scrollbar-width' );

	const observer = new ResizeObserver(() => {
		const newWidth = window.innerWidth - document.documentElement.clientWidth;

		if ( newWidth !== currentWidth ) {
			scrollbarEvent.detail = {
				previous: currentWidth,
				current: newWidth
			};

			currentWidth = newWidth;

			window.dispatchEvent( scrollbarEvent );
		}
	});

	observer.observe( document.documentElement );

	// First load.
	const updateContainerContent = function () {
		const initialWidth = window.innerWidth - document.documentElement.clientWidth;
		domId.innerHTML = ':root{--scrollbar-width:' + initialWidth + 'px;--container-content:' + ( megaMenu ? megaMenu.offsetWidth : 0 ) + 'px}';
	}

	updateContainerContent();
	window.addEventListener( 'resize', updateContainerContent );

	// Start listening for changes.
	window.addEventListener(
		'scrollbar-width',
		function ( e ) {
			let newMegaMenu = doc.querySelector( '.header-nav .mega-menu-wrap .container .mega-menu' );
			domId.innerHTML = ':root{--scrollbar-width:' + e.detail.current + 'px;--container-content:' + ( newMegaMenu ? newMegaMenu.offsetWidth : 0 ) + 'px}';
		}
	);

	return observer;
}

// Siblings.
function btySiblings( el, filter ) {
	// create an empty array.
	let siblings = [];

	// if no parent, return empty list.
	if ( ! el || ! el.parentNode ) {
		return siblings;
	}

	// first child of the parent node.
	let sibling = el.parentNode.firstElementChild;

	// loop through next siblings until `null`.
	do {
		// push sibling to array.
		if ( sibling != el && ( ! filter || filter( sibling ) ) ) {
			siblings.push( sibling );
		}
	} while ( sibling = sibling.nextElementSibling );

	return siblings;
}

// Slide up.
function btySlideUp( target, duration = 200 ) {
	target.style.transitionProperty = 'height, margin, padding';
	target.style.transitionDuration = duration + 'ms';
	target.style.height             = target.offsetHeight + 'px';
	target.offsetHeight;
	target.style.overflow      = 'hidden';
	target.style.height        = 0;
	target.style.paddingTop    = 0;
	target.style.paddingBottom = 0;
	target.style.marginTop     = 0;
	target.style.marginBottom  = 0;

	window.setTimeout(
		function () {
			target.style.display = 'none';
			target.style.removeProperty( 'height' );
			target.style.removeProperty( 'padding-top' );
			target.style.removeProperty( 'padding-bottom' );
			target.style.removeProperty( 'margin-top' );
			target.style.removeProperty( 'margin-bottom' );
			target.style.removeProperty( 'overflow' );
			target.style.removeProperty( 'transition-duration' );
			target.style.removeProperty( 'transition-property' );
		},
		duration
	);
}

// Slide down.
function btySlideDown( target, duration = 200 ) {
	target.style.removeProperty( 'display' );
	let display = window.getComputedStyle( target ).display;

	if ( 'none' === display ) {
		display = 'block';
	}

	target.style.display = display;

	let height = target.offsetHeight;

	target.style.overflow      = 'hidden';
	target.style.height        = 0;
	target.style.paddingTop    = 0;
	target.style.paddingBottom = 0;
	target.style.marginTop     = 0;
	target.style.marginBottom  = 0;
	target.offsetHeight;
	target.style.transitionProperty = "height, margin, padding";
	target.style.transitionDuration = duration + 'ms';
	target.style.height             = height + 'px';

	target.style.removeProperty( 'padding-top' );
	target.style.removeProperty( 'padding-bottom' );
	target.style.removeProperty( 'margin-top' );
	target.style.removeProperty( 'margin-bottom' );

	window.setTimeout(
		function () {
			target.style.removeProperty( 'height' );
			target.style.removeProperty( 'overflow' );
			target.style.removeProperty( 'transition-duration' );
			target.style.removeProperty( 'transition-property' );
		},
		duration
	);
}

// Toggle dropdown.
function btyToggleDropdown( doc = document ) {
	let toggle = doc.querySelectorAll( '.toggle-dropdown .dropdown-summary' );
	if ( ! toggle.length ) {
		return;
	}

	toggle.forEach(
		function ( el ) {
			let parent      = el.parentNode,
				title       = el.querySelector( '.summary-info' ),
				mobileTitle = el.parentNode.querySelector( '.dropdown-content-title' );

			const clickAnyWhere = function ( e ) {
				let target = e.target;

				if ( target === el || target.classList.contains( 'content' ) || target.closest( '.dropdown-summary' ) ) {
					return;
				}

				if ( target.classList.contains( 'tab-head', 'active' ) ) {
					if ( title ) {
						title.innerText = target.innerText;
					}

					if ( mobileTitle ) {
						mobileTitle.innerText = target.innerText;
					}
				}

				parent.removeAttribute( 'open' );

				document.removeEventListener( 'click', clickAnyWhere );
			}

			el.onclick = function ( e ) {
				document.addEventListener( 'click', clickAnyWhere );

				let aria = el.hasAttribute( 'aria-expanded' );

				if ( parent.hasAttribute( 'open' ) ) {
					parent.removeAttribute( 'open' );

					if ( aria ) {
						el.setAttribute( 'aria-expanded', 'false' );
					}
				} else {
					let sibling = parent.parentNode.querySelector( '.toggle-dropdown[open]' );
					if ( sibling ) {
						sibling.removeAttribute( 'open' );

						let sibAria = sibling.querySelector( '.dropdown-summary[aria-expanded]' );
						if ( sibAria ) {
							sibAria.setAttribute( 'aria-expanded', 'false' );
						}
					}

					parent.setAttribute( 'open', '' );

					if ( aria ) {
						el.setAttribute( 'aria-expanded', 'true' );
					}
				}
			}
		}
	);
}

// Update aria expanded for summary <details> tag only.
function btyToggleDetails( doc = document ) {
	let details = doc.querySelectorAll( 'details' );
	if ( ! details.length ) {
		return;
	}

	details.forEach(
		function ( el ) {
			let summary = el.querySelector( 'summary' );
			if ( el.classList.contains( 'product-accordion' ) || el.classList.contains( 'collapsible-item' ) || el.classList.contains( 'order-note' ) || ! summary ) {
				return;
			}

			document.addEventListener(
				'click',
				function ( e ) {
					let target = e.target;

					if ( target === el || el.contains( target ) || target.closest( '.toggle-dropdown' ) ) {
						return;
					}

					let tmpAria = doc.querySelector( '[open] [aria-expanded]' );
					if ( tmpAria ) {
						tmpAria.setAttribute( 'aria-expanded', 'false' );
					}
				}
			);

			el.onclick = function ( e ) {
				let aria = summary.getAttribute( 'aria-expanded' );
				if ( ! aria ) {
					return;
				}

				if ( 'string' === typeof( el.getAttribute( 'open' ) ) ) {
					if ( aria ) {
						summary.setAttribute( 'aria-expanded', 'false' );
					}
				} else {
					let sibling = el.parentNode.querySelector( '[open]' );
					if ( sibling ) {
						let sibAria = sibling.querySelector( '[open] [aria-expanded]' );
						if ( sibAria ) {
							sibAria.setAttribute( 'aria-expanded', 'false' );
						}
					}

					if ( aria ) {
						summary.setAttribute( 'aria-expanded', 'true' );
					}
				}
			}
		}
	);
}

// Json parse.
function btyJsonParse( string ) {
	try {
		return JSON.parse( string.trim() );
	} catch ( e ) {
		return false;
	}
}

// Remove item in array.
function btyRemoveArrayItem( arr = [], item ) {
	if ( ! arr.length || ! item ) {
		return [];
	}

	return arr.filter(
		function ( el ) {
			return el != item;
		}
	);
}

// Set delay time when user typing.
const btySearchDelay = function ( timer = 0 ) {
	return function ( callback, ms ) {
		clearTimeout( timer );
		timer = setTimeout( callback, ms );
	};
}();

// Get image src.
function btyGetImageSrc( img ) {
	// Create canvas.
	let canvas  = document.createElement( 'canvas' ),
		context = canvas.getContext( '2d' );

	// Set width and height.
	canvas.width  = img.width;
	canvas.height = img.height;

	// Draw the image.
	context.drawImage( img, 0, 0 );

	return canvas.toDataURL( 'image/jpeg', 1.0 );
}

// Scrolling detect direction.
function btyScrollingDetect() {
	let body = document.body;

	if ( window.oldScroll > window.scrollY ) {
		body.classList.add( 'direction-up' );
		body.classList.remove( 'direction-down' );
	} else {
		body.classList.remove( 'direction-up' );
		body.classList.add( 'direction-down' );
	}

	// Reset state.
	window.oldScroll = window.scrollY;
}

// Set loading animation for image.
function btyImageLoad( image, image_src, image_key, ele_loading ) {
	let newImage = new Image();

	newImage.crossOrigin = 'anonymous';

	// Check local storage first.
	if ( sessionStorage.getItem( image_key ) ) {
		image.src = sessionStorage.getItem( image_key );
		return;
	}

	// Add loading animation.
	image.parentNode.classList.add( 'loading' );

	// Handle.
	newImage.onload = function () {
		ele_loading.classList.remove( 'loading' );
		let renderImage = btyGetImageSrc( newImage );

		// Set final image src.
		image.src = renderImage;

		// Save image to local storage.
		if ( image_key ) {
			sessionStorage.setItem( image_key, renderImage );
		}
	}

	newImage.onerror = function () {
		ele_loading.classList.remove( 'loading' );
	}

	// Set image src for 'newImage.onload' function handle.
	newImage.src = image_src;
}

// Get form data.
function btySerializeForm( form, type = 'string' ) {
	let obj      = {},
		formData = new FormData( form );

	for ( let key of formData.keys() ) {
		obj[ key ] = formData.get( key );
	}

	return 'string' === type ? JSON.stringify( obj ) : obj;
};

// Get price format.
function btyFormatPrice( money = 0, format = false ) {
	if ( 'string' === typeof( money ) ) {
		money = money.replace( '.', '' );
	}

	if ( false === format ) {
		format = btyGlobals.money_format;
	}

	let value            = '',
		placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;

	function defaultOption( opt, def ) {
		return 'undefined' === typeof( opt ) ? def : opt;
	}

	function formatWithDelimiters( number, precision, thousands, decimal ) {
		precision = defaultOption( precision, 2 );
		thousands = defaultOption( thousands, ',' );
		decimal   = defaultOption( decimal, '.' );

		if ( isNaN( number ) || number == null ) {
			return 0;
		}

		number = ( number / 100.0 ).toFixed( precision );

		let parts   = number.split( '.' ),
			dollars = parts[0].replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands ),
			money   = parts[1] ? ( decimal + parts[1] ) : '';

		return dollars + money;
	}

	switch ( format.match( placeholderRegex )[1] ) {
		case 'amount':
			value = formatWithDelimiters( money, 2 );
			break;
		case 'amount_no_decimals':
			value = formatWithDelimiters( money, 0 );
			break;
		case 'amount_with_comma_separator':
			value = formatWithDelimiters( money, 2, '.', ',' );
			break;
		case 'amount_no_decimals_with_comma_separator':
			value = formatWithDelimiters( money, 0, '.', ',' );
			break;
		case 'amount_with_space_separator':
			value = formatWithDelimiters( money, 2, ' ', ',' );
			break;
		case 'amount_with_period_and_space_separator':
			value = formatWithDelimiters( money, 2, ' ', '.' );
			break;
		case 'amount_no_decimals_with_space_separator':
			value = formatWithDelimiters( money, 0, '.', '' );
			break;
		case 'amount_with_apostrophe_separator':
			value = formatWithDelimiters( money, 2, "'", '.' );
			break;
	}

	return format.replace( placeholderRegex, value );
}

// Render price html.
function btyPriceHtml( price, compare_price = false, unit_price = false, unit_price_measurement = {} ) {
	let html         = '',
		regularPrice = btyStrings.product.regular_price;

	if ( compare_price ) {
		html += '<span class="price">';
		html += '<span class="sr-only">' + btyStrings.product.sale_price + ': </span>';
		html += btyFormatPrice( price );
		html += '</span>';

		html += '<s class="regular-price">';
		html += '<span class="sr-only">' + regularPrice + ': </span>';
		html += btyFormatPrice( compare_price );
		html += '</s>';
	} else {
		html += '<span class="regular-price">';
		html += '<span class="sr-only">' + regularPrice + ': </span>';
		html += btyFormatPrice( price );
		html += '</span>';
	}

	if ( unit_price ) {
		html += '<span class="unit-price">';
		html += btyFormatPrice( unit_price ) + '/' + unit_price_measurement.quantity_unit;
		html += '</span>';
	}

	return html;
}

// Parse html dom.
function btyGetSectionHtml( text = '', selector = '.shopify-section', html = 'inner' ) {
	let el = new DOMParser().parseFromString( text, 'text/html' ).querySelector( selector );

	return el ? ( 'inner' === html ? el.innerHTML : el.outerHTML ) : '';
}

/**
 * Update html dom.
 *
 * @param  array sections The response sections.
 * @param  array modules  The modules need update html dom.
 */
function btyUpdateHtml( sections, modules ) {
	modules.forEach(
		function ( mod ) {
			let query = document.querySelectorAll( mod.node );
			if ( ! query.length ) {
				return;
			}

			query.forEach(
				function ( el ) {
					el.innerHTML = btyGetSectionHtml( sections[ mod.section ], mod.selector );
				}
			);

			// Re-init function.
			btyAddToCart();
			btySwatch();
			btyQuickAdd();
			btyCarousel();
		}
	);
}

// Countdown time.
function btyCountdownTime( doc = document ) {
	let selectors = doc.querySelectorAll( '.countdown-time' );

	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let time        = el.getAttribute( 'data-time' ),
				dayField    = el.querySelector( '.days' ),
				hourField   = el.querySelector( '.hours' ),
				minuteField = el.querySelector( '.minutes' ),
				secondField = el.querySelector( '.seconds' );

			if ( ! dayField || ! hourField || ! minuteField || ! secondField ) {
				return;
			}

			// Check time first.
			if ( isNaN( Date.parse( time ) ) ) {
				return;
			}

			// Convert to milisecond.
			let interval,
				second = 1000,
				minute = second * 60,
				hour   = minute * 60,
				day    = hour * 24,
				today  = new Date();

			const countDownFn = function () {
				let countDown = new Date( time ).getTime(),
					now       = new Date().getTime(),
					distance  = countDown - now,
					dayInner  = Math.floor( distance / day );

				if ( distance < 0 ) {
					el.parentNode.remove();

					clearInterval( init );

					return;
				}

				dayField.innerText    = ( '0' + dayInner).slice(-2);
				hourField.innerText   = ( '0' + Math.floor( ( distance % day ) / hour ) ).slice( -2 );
				minuteField.innerText = ( '0' + Math.floor( ( distance % hour ) / minute ) ).slice( -2 );
				secondField.innerText = ( '0' + Math.floor( ( distance % minute ) / second ) ).slice( -2 );

				// Show countdown.
				el.parentNode.classList.remove( 'hidden' );
			}

			let init = setInterval( countDownFn, 0 );
		}
	);
}

/**
 * Close theme popup
 *
 * @param  string class_name  Class name remove form <html>
 * @return node   parent_node Parent node to implement click overlay.
 */
function btyClosePopup( class_name, parent_node, overlay = true ) {
	if ( ! class_name ) {
		return;
	}

	let doc    = document.documentElement,
		button = parent_node ? parent_node.querySelector( '.close-button' ) : false;

	// Click to popup overlay.
	if ( parent_node && overlay ) {
		const parentHandle = function ( e ) {
			if ( e.target != parent_node ) {
				return;
			}

			doc.classList.remove( class_name );
			parent_node.removeEventListener( 'click', parentHandle );
			document.dispatchEvent( new CustomEvent( 'theme-popup-close' ) );
		}

		parent_node.addEventListener( 'click', parentHandle );
	}

	// Use ESC key.
	doc.addEventListener(
		'keyup',
		function ( e ) {
			if ( 27 !== e.keyCode ) {
				return;
			}

			doc.classList.remove( class_name );
			document.dispatchEvent( new CustomEvent( 'theme-popup-close' ) );
		}
	);

	// Use close button.
	if ( button ) {
		const buttonHandle = function () {
			doc.classList.remove( class_name );
			button.removeEventListener( 'click', buttonHandle );
			document.dispatchEvent( new CustomEvent( 'theme-popup-close' ) );
		}

		button.addEventListener( 'click', buttonHandle );
	}
}

// Quick search.
function btyQuickSearch() {
	let actions = document.querySelectorAll( '.action-search' ),
		dialog  = document.querySelector( '.quick-search' );

	if ( ! actions.length || ! dialog ) {
		return;
	}

	// Toggle quick search.
	actions.forEach(
		function ( el ) {
			el.onclick = function ( e ) {
				e.preventDefault();

				document.documentElement.classList.add( 'quick-search-open' );
				btyClosePopup( 'quick-search-open', dialog, false );

				let searchInput = document.querySelector( '.quick-search-form .search-input' );
				if (searchInput) {
					searchInput.focus();
				}
			}
		}
	);

	const buttonHandle = function ( e ) {
		let target = e.target;
		if ( ! target.closest( '.quick-search' ) && ! target.classList.contains( 'action-search' ) ) {
			document.documentElement.classList.remove( 'quick-search-open' );
		}
	}

	document.addEventListener( 'click', buttonHandle );
}

// Quantity button.
function btyQuantityButton( doc = document ) {
	let buttons = doc.querySelectorAll( '.quantity-button' );
	if ( ! buttons.length ) {
		return;
	}

	buttons.forEach(
		function ( el ) {
			let eventChange = new Event( 'change', { bubbles: true } );

			el.onclick = function () {
				let input = el.parentNode.querySelector( '.quantity-input' );
				if ( ! input ) {
					return;
				}

				let current = Number( input.value || 0 ),
					step    = Number( input.getAttribute( 'step' ) || 1 ),
					min     = Number( input.getAttribute( 'min' ) || 0 ),
					max     = Number( input.getAttribute( 'max' ) ),
					name    = el.name;

				if ( 'minus' === name && current >= step ) { // Minus button.
					if ( current <= min || ( current - step ) < min ) {
						return;
					}

					input.value = current - step;
				} else if ( 'plus' === name ) { // Plus button.
					if ( max && ( current >= max || ( current + step ) > max ) ) {
						return;
					}

					input.value = current + step;
				}

				// Trigger event.
				input.dispatchEvent( eventChange );
			}
		}
	);
}

// Main menu.
function btyNavMenu( doc = document, event = false ) {
	let toggle = doc.querySelector( '.toggle-panel-button' ),
		panel  = doc.querySelector( '.site-panel' );

	if ( ! toggle || ! panel ) {
		return;
	}

	// Close site panel when settings update.
	if ( event && event.detail.load ) {
		btyClosePopup( 'site-panel-open', panel );
	}

	// Toggle site panel.
	toggle.onclick = function () {
		document.documentElement.classList.add( 'site-panel-open' );
		btyClosePopup( 'site-panel-open', panel );
	}

	toggle.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			document.documentElement.classList.add( 'site-panel-open' );
			btyClosePopup( 'site-panel-open', panel );
		}
	});

	// Toggle sub menu.
	let links = doc.querySelectorAll( '.site-panel .has-children' );
	if ( ! links.length ) {
		return;
	}

	links.forEach(
		function ( el ) {
			el.onclick = function ( e ) {
				if ( e.target.classList.contains( 'menu-text' ) ) {
					return;
				}

				e.preventDefault();

				let menu    = el.closest( '.toggle-navigation' ),
					parent  = el.parentNode,
					subMenu = parent.querySelector( '.sub-menu' ) || parent.querySelector( '.sub-mega-menu' );
				if ( ! subMenu ) {
					return;
				}

				parent.classList.add( 'active' );

				// Update current sub menu.
				let level = Number( subMenu.getAttribute( 'data-level' ) || 1 ),
					back  = parent.querySelector( '.back' );
				if ( level ) {
					menu.setAttribute( 'data-level', level );
				}

				// Go back parent level.
				if ( back ) {
					back.onclick = function () {
						parent.classList.remove( 'active' );
						menu.setAttribute( 'data-level', level - 1 );
					}
				}
			}
		}
	);
}

// Split Slider.
function btySplitSlider( doc = document ) {
	let selectors = doc.querySelectorAll( '.split-slider' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let imageCarouselOption, imageCarousel, textCarouselOption, textCarousel,
				imageEl = el.querySelector( '.image-content .swiper' ),
				textEl  = el.querySelector( '.text-content .swiper' ),
				mobile  = window.matchMedia( '(max-width: 991px)' ).matches || window.matchMedia( '(hover: none)' ).matches

			imageCarouselOption = {
				speed: 600,
				spaceBetween: 40,
				scrollbar: {
					el: ".split-slider .swiper-scrollbar",
					draggable: true
				},
				breakpoints: {
					240: {
						slidesPerView: 1
					},
					992: {
						slidesPerView: 1.25
					}
				}
			}

			// Image card.
			if ( imageEl && ! imageEl.classList.contains( 'swiper-initialized' ) ) {
				imageCarousel = new Swiper( imageEl, imageCarouselOption );
			}

			textCarouselOption = {
				speed: 600,
				spaceBetween: 40,
				scrollbar: {
					el: ".split-slider .swiper-scrollbar",
					draggable: true
				},
				breakpoints: {
					240: {
						slidesPerView: 1
					},
					992: {
						slidesPerView: 1
					}
				}
			}

			// Layout.
			if ( el.classList.contains( 'content-layout' ) ) {
				textCarouselOption.centeredSlides = true;
				textCarouselOption.spaceBetween   = 200;

				if ( mobile ) {
					textCarouselOption.autoHeight = true;
				}
			} else {
				textCarouselOption.autoHeight = true;

				textCarouselOption.navigation = {
					nextEl: el.querySelector( '.text-content .swiper-button-next' ),
					prevEl: el.querySelector( '.text-content .swiper-button-prev' )
				}
			}

			// Text content.
			if ( textEl && ! textEl.classList.contains( 'swiper-initialized' ) ) {
				textCarousel = new Swiper( textEl, textCarouselOption );
			}

			// Sync controls.
			if ( textCarousel && imageCarousel ) {
				textCarousel.controller.control  = imageCarousel;
				imageCarousel.controller.control = textCarousel;
			}
		}
	);
}

// Account popup.
function btyAccountPopup( doc = document ) {
	let selectors = doc.querySelectorAll( '.action-account' ),
		customer  = document.querySelector( '.customer-wraper' );
	if ( ! selectors.length || ! customer || document.body.classList.contains( 'has-account-details' ) ) {
		return;
	}

	// Get display style.
	const getStyles = function ( el, property = 'display' ) {
		let obj = window.getComputedStyle( el, null );

		return obj.getPropertyValue( property );
	}

	// Get first input field.
	const getInput = function ( parent ) {
		return parent.querySelector( '.field input' );
	}

	// Toggle popup.
	selectors.forEach(
		function ( el ) {
			el.onclick = function ( e ) {
				if ( el.classList.contains( 'new-customer-accounts' ) ) {
					return;
				}

				e.preventDefault();

				let login    = customer.querySelector( '.login' ),
					loginBox = login ? login.querySelector( '#login-container' ) : false,
					recover  = login ? login.querySelector( '#recover-container' ) : false,
					register = customer.querySelector( '.register' );

				if ( ! recover || ! loginBox || ! register ) {
					return;
				}

				document.documentElement.classList.add( 'customer-open' );

				// Focus input field on desktop.
				if ( window.matchMedia( '(min-width: 992px)' ).matches ) {
					if ( getStyles( register ) === 'block' ) {
						getInput( register ).focus();
					} else if ( getStyles( recover ) === 'block' ) {
						getInput( recover ).focus();
					} else if ( getStyles( loginBox ) === 'block' ) {
						getInput( loginBox ).focus();
					}
				}

				// Close popup.
				btyClosePopup( 'customer-open', customer );

				customer.onclick = function ( e ) {
					let target = e.target;

					// Create account.
					if ( target.classList.contains( 'create-account' ) ) {
						e.preventDefault();

						login.classList.add( 'hidden' );
						register.classList.remove( 'hidden' );

						getInput( register ).focus();
					}

					// Sign-in.
					if ( target.classList.contains( 'sign-in' ) ) {
						e.preventDefault();

						login.classList.remove( 'hidden' );
						register.classList.add( 'hidden' );

						getInput( loginBox ).focus();
					}

					// Fogot password.
					if ( target.classList.contains( 'forgot-password' ) ) {
						setTimeout(
							function () {
								getInput( recover ).focus();
							}
						);
					}

					// Cancel login.
					if ( target.classList.contains( 'login-cancel' ) ) {
						setTimeout(
							function () {
								getInput( loginBox ).focus();
							}
						);
					}
				}
			}
		}
	);
}

// Update cart item count.
function btyCartItemCount( items = 0 ) {
	let count = document.querySelectorAll( '.cart-item-count' );
	if ( ! count.length ) {
		return;
	}

	items = Number( items );

	count.forEach(
		function ( el ) {
			el.innerHTML = items;
		}
	);
}

// Find if two arrays contain any common item in Javascript.
function btyDiffObject( haystack, arr ) {
	return arr.every(
		function ( v ) {
			return haystack.includes( v );
		}
	);
};

// Selected variant image.
function btySelectedVariant( variant, data, slider ) {
	for ( let opt in data ) {
		if ( btyDiffObject( Object.values( variant ), data[opt].options ) ) {
			if ( 'object' === typeof( slider ) && Object.keys( slider ).length && data[opt].featured_media ) {
				slider.slideTo( ( data[opt].featured_media.position - 1 ), 500, false );
			}

			return data[opt];
		}
	}
}

// Fetch cart data.
function btyFetchCart( obj, modules, item ) {
	let body = JSON.stringify( obj );

	fetch( btyGlobals.cart_change_url, {...btyFetchConfig(), ...{ body } } )
		.then(
			function ( r ) {
				return r.json();
			}
		).then(
			function ( res ) {
				let warning = item.querySelectorAll( '.product-warning' );

				if ( warning.length ) {
					warning.forEach(
						function ( el ) {
							el.innerHTML = '';
						}
					);
				}

				if ( res.errors && warning.length ) {
					warning.forEach(
						function ( el ) {
							el.innerHTML = btyGlobals.svg_warning + res.errors;
						}
					);

					let qtyInput = item.querySelectorAll( '.quantity-input' );
					if ( qtyInput.length ) {
						qtyInput.forEach(
							function ( el ) {
								el.value = el.getAttribute( 'data-qty' );
							}
						);
					}

					return;
				}

				// Update cart item count first.
				btyCartItemCount( res.item_count );

				// Cart empty.
				if ( ! res.items.length ) {
					let cartTable       = document.querySelector( '.cart-page-section .container' ),
						cartSubtotal    = cartTable ? cartTable.querySelector( '.cart-footer' ) : false,
						sideCartContent = document.querySelector( '.side-cart-content' ),
						sideCartFooter  = document.querySelector( '.side-cart-footer' );

					// Update cart table section.
					if ( cartTable ) {
						cartTable.innerHTML = btyGetSectionHtml( res.sections['main-cart'], '.container' );
					}

					// Remove cart subtotal section.
					if ( cartSubtotal ) {
						cartSubtotal.remove();
					}

					// Update side cart content.
					if ( sideCartContent ) {
						sideCartContent.innerHTML = btyGetSectionHtml( res.sections['side-cart'], '.side-cart-content' );
					}

					// Remove side cart footer.
					if ( sideCartFooter ) {
						sideCartFooter.remove();
					}

					// Open login popup when cart empty.
					btyAccountPopup();
				}

				// Update current item.
				let currentItem = res.items.filter( (e) => e.id === Number( obj.id ) );
				if ( currentItem.length ) {
					let sidecartContent = item.closest( '.side-cart-content' ),
						totalPrice      = item.querySelector( '.totals-item-price' ),
						quantityUnit    = item.querySelectorAll( '[name="quantity"]' );
					if ( totalPrice ) {
						totalPrice.innerHTML = btyGetSectionHtml( res.sections['main-cart'], '[data-id="' + obj.id + '"] .totals-item-price' );
					}

					if ( sidecartContent ) {
						item.innerHTML = btyGetSectionHtml( res.sections['side-cart'], '[data-id="' + obj.id + '"]' );
					}

					if ( quantityUnit.length ) {
						quantityUnit.forEach(
							function ( el ) {
								el.setAttribute( 'data-qty', obj.quantity );
							}
						);
					}
				} else {
					item.remove();
				}

				// Update html.
				btyUpdateHtml( res.sections, modules );

				// Update sidecart total price.
				let sideCartPrice = document.querySelector( '.side-cart-footer .total-price' );
				if ( sideCartPrice ) {
					sideCartPrice.innerHTML = btyGetSectionHtml( res.sections['side-cart'], '.total-price' );
				}

				// Re-init quantity button.
				btyQuantityButton();

				// Re-init update product quantity.
				btyUpdateProductQuantity();

				// Update cart progress bar.
				btyUpdateProgressBarCart( res.total_price );

				// Update progress bar.
				if ( sideCartPrice ) {
					let total_price_str    = sideCartPrice.textContent.replace( /\D/g,'' ),
						total_price_number = Number( total_price_str );

					btyUpdateProgressBarCart( total_price_number );
				}

				let mainCartPrice = document.querySelector( '.cart-page-section .cart-totals .totals-price' );
				if ( mainCartPrice ) {
					let total_price_str    = mainCartPrice.textContent.replace( /\D/g,'' ),
						total_price_number = Number( total_price_str );

					btyUpdateProgressBarCart( total_price_number );
				}

				// Re-init minicart recommendations.
				btyAnimationImageLoad();
				btyCarousel();
				btyScrollAnimationTrigger();
				btyMinicartRecommendations();

				// Re-init cart popup outer.
				btySideCartPopupOuter();
			}
		).catch(
			function ( e ) {
				console.error( e );
			}
		).finally(
			function () {
				// Remove loading.
				item.classList.remove( 'updating' );
			}
		);
}

// Update product quantity.
function btyUpdateProductQuantity( doc = document ) {
	let item = doc.querySelectorAll( '.product-item[data-id]' );
	if ( ! item.length ) {
		return;
	}

	// Register dom html need an update when the response available.
	let modules = [
		{
			node: '.cart-totals',
			section: 'main-cart',
			selector: '.cart-totals'
		},
		{
			node: false,
			section: 'side-cart',
			selector: false
		}
	];

	item.forEach(
		function ( el ) {
			let id = el.getAttribute( 'data-id' );

			if ( ! id ) {
				return;
			}

			let removes = el.querySelectorAll( '.product-remove' ),
				inputs  = el.querySelectorAll( '.quantity-input' );

			// Quantity change.
			if ( inputs.length ) {
				inputs.forEach(
					function ( input ) {
						input.onchange = function () {
							let data, quantity = Number( input.value.trim() );

							// Loading effect.
							el.classList.add( 'updating' );

							data = {
								id: id,
								quantity: quantity,
								sections: modules.map( (s) => s.section ),
								sections_url: window.location.pathname
							}

							// Fetch data.
							btyFetchCart( data, modules, el );
						}
					}
				);
			}

			// Remove button click.
			if ( removes.length ) {
				removes.forEach(
					function ( remove ) {
						remove.onclick = function ( e ) {
							e.preventDefault();

							// Loading effect.
							el.classList.add( 'updating' );

							let data = {
								id: id,
								quantity: 0,
								sections: modules.map( (s) => s.section ),
								sections_url: window.location.pathname
							}

							// Fetch data.
							btyFetchCart( data, modules, el );
						}
					}
				);
			}
		}
	);
}

// Variant options.
function btyProductVariants( doc = document, output = false ) {
	let data, selector = doc.querySelectorAll( '.product-variants' );
	if ( ! selector.length ) {
		return;
	}

	selector.forEach(
		function( sl ) {
			let variants = sl.parentNode.querySelector( '[data-product-variants]' ),
				quantity = sl.parentNode.querySelector( '[data-inventory-quantity]' ),
				field    = sl.querySelectorAll( '.field-value' );
			if ( ! field.length || ! variants | ! quantity ) {
				return;
			}

			let product      = sl.closest( '.main-product' ),
				gallery      = product ? product.querySelector( '.product-gallery' ) : false,
				featured     = sl.closest( '.featured-product-product' ),
				image        = featured ? featured.querySelector( '.media-preview' ) : false,
				summary      = sl.closest( '.product-summary' ),
				variant_pick = {};

			variants = btyJsonParse( variants.textContent );
			quantity = btyJsonParse( quantity.textContent );

			let price       = summary.querySelector( '.product-price' ),
				form        = summary.querySelector( '[data-type="add-to-cart-form"]' ),
				input       = form ? form.querySelector( '.quantity-input' ) : false,
				productId   = form ? form.querySelector( '[name="id"]' ) : false,
				button      = form ? form.querySelector( '[name="add"]' ) : false,
				price_2     = summary.querySelector( '.product-price-floated .product-price' ),
				form_2      = summary.querySelector( '.product-floated-product-form [data-type="add-to-cart-form"]' ),
				input_2     = form_2 ? form_2.querySelector( '.quantity-input' ) : false,
				productId_2 = form_2 ? form_2.querySelector( '[name="id"]' ) : false,
				button_2    = form_2 ? form_2.querySelector( '[name="add"]' ) : false,
				productUrl  = sl.getAttribute( 'data-url' ),
				pickup      = summary.querySelector( '.pickup-availability' ),
				amount      = summary.querySelector( '.product-sale-label .sale-total .saved-number' );

			field.forEach(
				function( el ) {
					if ( 'radio' === el.type ) {
						if ( el.checked ) {
							variant_pick[ el.name ] = el.value;
						}
					} else {
						variant_pick[ el.name ] = el.value;
					}

					el.onchange = function() {
						variant_pick[ el.name ] = el.value;

						// Update stock status.
						btyUpdateStockStatusProduct( variants, sl );

						// When variant change.
						let selected = btySelectedVariant( variant_pick, variants );

						if ( selected ) {
							// Update product variant ID.
							if ( productId ) {
								productId.value = selected.id;
							}

							if ( productId_2 ) {
								productId_2.value = selected.id;
							}

							// Update image on Featured product.
							if ( image && selected.featured_image ) {
								image.removeAttribute( 'srcset' );
								btyImageLoad( image, selected.featured_image.src, selected.featured_media.id, image.parentNode );
							}

							// Update product url, for product page only.
							if ( productUrl && gallery ) {
								window.history.replaceState( {}, '', productUrl + '?variant=' + selected.id );
							}

							// Update price.
							if ( price ) {
								price.innerHTML = btyPriceHtml( selected.price, selected.compare_at_price, selected.unit_price, selected.unit_price_measurement );
							}

							// Update saved price badge.
							if ( amount ) {
								if ( selected.compare_at_price ) {
									let amountTotal = 100 * ( selected.compare_at_price - selected.price ) / selected.compare_at_price;

									amount.innerHTML = amountTotal.toFixed( 0 );

									amount.closest( '.summary-item' ).classList.remove( 'hidden' );
								} else {
									amount.closest( '.summary-item' ).classList.add( 'hidden' );
								}
							}

							// Update price floated.
							if ( price_2 ) {
								price_2.innerHTML = btyPriceHtml( selected.price, selected.compare_at_price, selected.unit_price, selected.unit_price_measurement );
							}

							// Set max quantity.
							if ( input ) {
								let max = quantity.filter(
									function ( e ) {
										return e.id === selected.id;
									}
								);

								if ( max.length ) {
									let qty = max[0].qty;

									if ( qty > 0 ) {
										if ( Number( input.value ) > qty ) {
											input.value = qty;
										}

										input.setAttribute( 'max', qty );
									} else {
										input.removeAttribute( 'max' );
									}
								} else {
									input.removeAttribute( 'max' );
								}
							}

							// Group image.
							let groupImage = document.querySelectorAll( '.check-group-image .swiper[data-color]' );
							if ( groupImage.length ) {
								let colorName = selected.featured_media && selected.featured_media.alt ? selected.featured_media.alt.split( '_' )[0] : false;
								if ( colorName ) {
									groupImage.forEach(
										function( gi ) {
											let label = gi.getAttribute( 'data-color' );
											if ( ! label ) {
												return;
											}

											if ( colorName.trim().toLowerCase() == label ) {
												gi.classList.remove( 'group-hidden' );
											} else {
												gi.classList.add( 'group-hidden' );
											}
										}
									);
								}
							} else {
								// Scroll to current variant media.
								let headerSticky = document.querySelector( '.header.is-sticky' ),
									headerHeight = headerSticky ? headerSticky.offsetHeight : 0,
									currentMedia = gallery && 'layout-1' == gallery.getAttribute( 'data-id' ) && selected.featured_media ? gallery.querySelector( '.media-preview-wrap[data-id="' + selected.featured_media.id + '"]' ) : false;
								if ( currentMedia && window.matchMedia( '(min-width: 992px)' ).matches ) {
									window.scrollTo(
										{
											top: ( currentMedia.getBoundingClientRect().top + window.pageYOffset - headerHeight ),
											behavior: 'smooth'
										}
									);

									indexSlide = Number( currentMedia.getAttribute( 'data-pos' ) ) - 1;
								}
							}
						}

						// Update shop pay installments.
						let shopifyPayment = document.querySelector( 'shopify-payment-terms' );
						if ( shopifyPayment ) {
							shopifyPayment.setAttribute( 'variant-id', selected.id );
						}

						// Pickup availability, sold out products should not show the pickup availability.
						if ( pickup ) {
							if ( selected && selected.available ) {
								btyPickupAvailability( doc, productId.value, pickup );
							} else {
								pickup.innerHTML = '';
							}
						}

						// Update selected option.
						let selectedOption = el.closest( '.variant-field' ).querySelector( '.field-title .selected-value' );
						if ( selectedOption ) {
							selectedOption.innerText = el.value.trim();
						}

						// Update form state.
						if ( form ) {
							if ( selected && selected.available ) {
								form.classList.remove( 'disabled' );
							} else {
								form.classList.add( 'disabled' );
							}
						}

						if ( form_2 ) {
							if ( selected && selected.available ) {
								form_2.classList.remove( 'disabled' );
							} else {
								form_2.classList.add( 'disabled' );
							}
						}

						// Update add to cart button text.
						if ( button ) {
							if ( selected ) {
								if ( selected.available ) {
									button.innerHTML = btyStrings.product.add_to_cart;
									button.classList.remove( 'disabled' );
									price.classList.remove( 'hidden' );
								} else {
									button.innerHTML = btyStrings.product.out_of_stock;
									button.classList.add( 'disabled' );
									price.classList.remove( 'hidden' );
								}
							} else {
								price.classList.add( 'hidden' );
								button.classList.add( 'disabled' );
								button.innerHTML = btyStrings.product.unavailable;
							}
						}

						if ( button_2 ) {
							if ( selected ) {
								if ( selected.available ) {
									button_2.innerHTML = btyStrings.product.add_to_cart;
									button_2.classList.remove( 'disabled' );
								} else {
									button_2.innerHTML = btyStrings.product.out_of_stock;
									button_2.classList.add( 'disabled' );
								}
							} else {
								button_2.classList.add( 'disabled' );
								button_2.innerHTML = btyStrings.product.unavailable;
							}
						}

						// Add custo event.
						const customData  = {
							detail: {
								selected: selected
							}
						}

						const customEvent = new CustomEvent( 'product-variant-updated', customData );
						document.dispatchEvent( customEvent );
					}
				}
			);

			// Update stock status, first load.
			btyUpdateStockStatusProduct( variants, sl );

			// Pickup availability, sold out products should not show the pickup availability.
			let firstSelected = btySelectedVariant( variant_pick, variants );
			if ( pickup && firstSelected && firstSelected.available ) {
				btyPickupAvailability( doc, firstSelected.id, pickup );
			}
		}
	);
}

// Quick view variant options.
function btyQuickViewVariants( doc = document, slider = {} ) {
	let selector = doc.querySelector( '.product-variants' );

	if ( ! selector ) {
		return;
	}

	let variants = selector.parentNode.querySelector( '[data-product-variants]' ),
		quantity = selector.parentNode.querySelector( '[data-inventory-quantity]' ),
		field    = selector.querySelectorAll( '.field-value' );

	if ( ! field.length || ! variants ) {
		return;
	}

	let summary      = selector.parentNode,
		variant_pick = {};

	variants = btyJsonParse( variants.textContent );
	quantity = btyJsonParse( quantity.textContent );

	field.forEach(
		function ( el ) {
			if ( 'radio' === el.type ) {
				if ( el.checked ) {
					variant_pick[ el.name ] = el.value;
				}
			} else {
				variant_pick[ el.name ] = el.value;
			}

			el.onchange = function () {
				variant_pick[ el.name ] = el.value;

				// Update stock status.
				btyUpdateStockStatusProduct( variants, selector );

				// When variant change.
				let selected    = btySelectedVariant( variant_pick, variants, slider ),
					price       = summary.querySelector( '.product-price' ),
					labeled     = el.parentNode.querySelector( '.selected-value' ),
					form        = summary.querySelector( '[data-type="add-to-cart-form"]' ),
					input       = form ? form.querySelector( '.quantity-input' ) : false,
					productId   = form ? form.querySelector( '[name="id"]' ) : false,
					productLink = summary.querySelector( '.product-url' ),
					productUrl  = selector ? selector.getAttribute( 'data-url' ) : false,
					button      = form ? form.querySelector( '[name="add"]' ) : false,
					amount      = summary.querySelector( '.sale-total' ),
					shareInput  = summary.querySelector( '.product-share .field-input' );

				// Update product url.
				if ( productUrl ) {
					if ( productLink ) {
						productLink.href = productUrl + '?variant=' + selected.id;
					}

					if ( shareInput ) {
						shareInput.value = window.location.origin + productUrl + '?variant=' + selected.id;
					}
				}

				// Current swatch label.
				let currentSwatch = el.closest( '.variant-field' ).querySelector( '.field-title .selected-value' );

				if ( currentSwatch ) {
					currentSwatch.innerText = el.getAttribute( 'data-value' ).trim();
				}

				// Update price.
				if ( price ) {
					price.innerHTML = btyPriceHtml( selected.price, selected.compare_at_price, selected.unit_price, selected.unit_price_measurement );
				}

				// Update selected value.
				if ( labeled ) {
					labeled.innerHTML = el.value;
				}

				// Update sale number badge.
				if ( amount ) {
					if ( selected.compare_at_price ) {
						let amountTotal = 100 * ( selected.compare_at_price - selected.price ) / selected.compare_at_price;

						amount.innerHTML = parseFloat( amountTotal.toFixed( 2 ) );

						amount.parentNode.classList.remove( 'hidden' );
					} else {
						amount.parentNode.classList.add( 'hidden' );
					}
				}

				// Update product variant ID.
				if ( productId ) {
					productId.value = selected.id;
				}

				// Set max quantity.
				if ( input ) {
					let max = quantity.filter(
						function ( e ) {
							return e.id === selected.id;
						}
					);
					if ( max.length ) {
						let qty = max[0].qty;

						if ( qty > 0 ) {
							if ( Number( input.value ) > qty ) {
								input.value = qty;
							}

							input.setAttribute( 'max', qty );
						} else {
							input.removeAttribute( 'max' );
						}
					} else {
						input.removeAttribute( 'max' );
					}
				}

				// Update form state.
				if ( form ) {
					if ( selected.available ) {
						form.classList.remove( 'disabled' );
					} else {
						form.classList.add( 'disabled' );
					}
				}

				// Update add to cart button text.
				if ( button ) {
					if ( selected.available ) {
						button.innerHTML = btyStrings.product.add_to_cart;
					} else {
						button.innerHTML = btyStrings.product.out_of_stock;
					}
				}
			}
		}
	);

	// For first load.
	btySelectedVariant( variant_pick, variants, slider );
}

// Quick view.
function btyQuickView( doc = document ) {
	let box      = document.querySelector( '.quick-view' ),
		content  = box ? box.querySelector( '.quick-view-content' ) : false,
		selector = doc.querySelectorAll( '.product-quick-view' );
	if ( ! content || ! selector.length ) {
		return;
	}

	selector.forEach(
		function ( el ) {
			el.onclick = function ( e ) {
				e.preventDefault();
				let product_id = el.parentNode.getAttribute( 'data-id' );
				if ( product_id == box.getAttribute( 'data-id' ) ) {
					document.documentElement.classList.add( 'quick-view-open' );
					return;
				}

				document.documentElement.classList.add( 'quick-view-open' );
				box.classList.add( 'loading' );
				box.setAttribute( 'data-id', product_id );

				fetch( el.href + '?sections=quickview' )
					.then(
						function ( r ) {
							if ( 200 !== r.status ) {
								console.log( 'Status Code: ' + r.status );
								throw r;
							}

							return r.json();
						}
					).then(
						function ( res ) {
							content.innerHTML = btyGetSectionHtml( res.quickview );

							let options,
								gallery = document.querySelector( '.quick-view .product-gallery .swiper' );

							if ( gallery ) {
								options = {
									slidesPerView: 1,
									spaceBetween: 10,
									navigation: {
										nextEl: '.quick-view .swiper-button-next',
										prevEl: '.quick-view .swiper-button-prev'
									},
									pagination: {
										el: '.quick-view .swiper-pagination',
										type: 'bullets',
										clickable: true
									}
								}

								let quickViewSlide = new Swiper( gallery, options );

								btyQuickViewVariants( box, quickViewSlide );
							} else {
								btyQuickViewVariants( box, {} );
							}
						}
					).catch(
						function ( e ) {
							console.error( e );
						}
					).finally(
						function () {
							// Re-init share.
							btyProductShare();

							// Re-init quantity.
							btyQuantityButton();

							// Update lazy load image.
							btyAnimationImageLoad( box, 0 );

							// Re-init add to cart.
							btyAddToCart();

							// Remove loading.
							box.classList.remove( 'loading' );

							// Close popup.
							btyClosePopup( 'quick-view-open', box );
						}
					);
			}
		}
	);
}

// Update storage.
function btyUpdateStorage( key, array, id, type = 'local' ) {
	let storage = 'local' === type ? localStorage : sessionStorage;

	if ( ! storage.getItem( key ) ) {
		// Set key.
		storage.setItem( key, JSON.stringify( array ) );
	} else if ( ! storage.getItem( key ).includes( id ) ) {
		// Add new id.
		let parseStorage = btyJsonParse( storage.getItem( key ) );
		if ( ! parseStorage ) {
			return;
		}

		parseStorage.push( id );

		storage.setItem( key, JSON.stringify( parseStorage ) );
	}
}

// Update variants on popup.
function btyVariantsPopup( doc = document, popup ) {
	let variants = doc.querySelectorAll( '.product-variants' );
	if ( ! popup || ! variants.length ) {
		return;
	}

	variants.forEach(
		function ( el ) {
			let variantData = el.querySelector( '[data-product-variants]' ),
				productId   = el.getAttribute( 'data-id' ),
				select      = el.querySelectorAll( '.field-value' ),
				imageLink   = popup.querySelector( '.preview-image [data-id="' + productId + '"]' ),
				image       = imageLink ? imageLink.querySelector( 'img' ) : false,
				price       = popup.querySelector( '[data-id="' + productId + '"] .product-price' ),
				stock       = popup.querySelector( '[data-id="' + productId + '"] .product-stock-status' ),
				form        = popup.querySelector( '.form-add-to-cart[data-id="' + productId + '"]' ),
				inputId     = form ? form.querySelector( '[name="id"]' ) : false,
				variantPick = {};

			if ( ! select.length ) {
				return;
			}

			variantData = variantData ? btyJsonParse( variantData.textContent ) : false;
			if ( ! variantData ) {
				return;
			}

			// Foreach.
			select.forEach(
				function ( sel ) {
					variantPick[ sel.name ] = sel.value;

					// Change event.
					sel.onchange = function () {
						variantPick[ sel.name ] = sel.value;

						let selected = btySelectedVariant( variantPick, variantData );

						// Update image.
						if ( image ) {
							image.removeAttribute( 'srcset' );
							btyImageLoad( image, selected.featured_media.preview_image.src, selected.featured_media.id, image.parentNode );
						}

						// Update current variant id.
						if ( inputId ) {
							inputId.value = selected.id;
						}

						// Update stock status, add to cart button text.
						if ( selected.available ) {
							if ( form ) {
								form.classList.remove( 'disabled' );
							}

							if ( stock ) {
								stock.innerHTML = btyStrings.product.in_stock;
								stock.classList.remove( 'inventory--low' );
								stock.classList.add( 'inventory--high' );
							}
						} else {
							if ( form ) {
								form.classList.add( 'disabled' );
							}

							if ( stock ) {
								stock.innerHTML = btyStrings.product.out_of_stock;
								stock.classList.remove( 'inventory--high' );
								stock.classList.add( 'inventory--low' );
							}
						}

						// Update price.
						if ( price ) {
							price.innerHTML = btyPriceHtml( selected.price, selected.compare_at_price );
						}
					}
				}
			);

			// First matching variants.
			let firstSelected = btySelectedVariant( variantPick, variantData );
			if ( firstSelected.available ) {
				if ( form ) {
					form.classList.remove( 'disabled' );
				}

				if ( stock ) {
					stock.innerHTML = btyStrings.product.in_stock;
					stock.classList.remove( 'inventory--low' );
					stock.classList.add( 'inventory--high' );
				}
			} else {
				if ( form ) {
					form.classList.add( 'disabled' );
				}

				if ( stock ) {
					stock.innerHTML = btyStrings.product.out_of_stock;
					stock.classList.remove( 'inventory--high' );
					stock.classList.add( 'inventory--low' );
				}
			}

			if ( price ) {
				price.innerHTML = btyPriceHtml( firstSelected.price, firstSelected.compare_at_price );
			}
		}
	);
}

// Open side cart.
function btySideCart() {
	let buttons  = document.querySelectorAll( '.action-cart' ),
		sideCart = document.querySelector( '.side-cart' );
	if ( ! buttons.length || ! sideCart ) {
		return;
	}

	buttons.forEach(
		function ( el ) {
			el.onclick = function ( e ) {
				e.preventDefault();

				document.documentElement.classList.add( 'side-cart-open' );

				btyClosePopup( 'side-cart-open', sideCart );
				let closeButton = sideCart.querySelector( '.side-cart-close' );
				if ( closeButton ) {
					setTimeout(
						function () {
							closeButton.focus();
						},
						400
					);
				}
			}
		}
	);
}

// Get fetch config.
function btyFetchConfig( type = 'json' ) {
	return {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/' + type
		}
	};
}

// ValidateEmail.
function btyValidateEmail( selector ) {
	let mailformat = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

	selector.focus();

	if ( selector.value.match( mailformat ) ) {
		selector.classList.remove( 'email-invalid' );

		return true;
	} else {
		selector.classList.add( 'email-invalid' );

		return false;
	}
}

// Ajax add to cart.
function btyAddToCart( doc = document ) {
	let buttons = doc.querySelectorAll( '.add-to-cart-button' );
	if ( ! buttons.length ) {
		return;
	}

	// Register dom html need an update when the response available.
	let modules = [
		{
			node: '.side-cart-inner', // DOM html selector.
			section: 'side-cart', // Section name.
			selector: '.side-cart-inner' // Ajax response selector.
		},
		{
			section: 'cart-count'
		}
	];

	buttons.forEach(
		function ( button ) {
			button.onclick = function ( e ) {
				// Return user click Tab button then Enter.
				if ( button.classList.contains( 'disabled' ) ) {
					e.preventDefault();

					return;
				}

				if ( 'A' === button.tagName.toUpperCase() ) {
					return;
				}

				e.preventDefault();

				if ( button.classList.contains( 'add-product-variants' ) && window.matchMedia( '(max-width: 767px)' ).matches ) {
					return;
				}

				button.classList.add( 'loading' );

				let form     = button.closest( '[data-type="add-to-cart-form"]' ),
					formData = new FormData( form ),
					warning  = form.parentNode.querySelector( '.product-warning' ),
					config   = btyFetchConfig( 'javascript' );

				config.headers['X-Requested-With'] = 'XMLHttpRequest';
				delete config.headers['Content-Type'];

				formData.append( 'sections', modules.map( (s) => s.section ) );
				formData.append( 'sections_url', window.location.pathname );
				config.body = formData;

				// Fetch data.
				fetch( btyGlobals.cart_add_url, config )
					.then(
						function ( r ) {
							return r.json();
						}
					).then(
						function ( res ) {
							if ( warning ) {
								warning.innerHTML = res.status ? btyGlobals.svg_warning + res.description : '';
							}

							if ( res.status ) {
								return;
							}

							// Update html.
							btyUpdateHtml( res.sections, modules );
							// Re-init update minicart recommendations.
							btyAnimationImageLoad();
							btyCarousel();
							btyScrollAnimationTrigger();
							btyMinicartRecommendations();

							// Update cart items count.
							btyCartItemCount( btyGetSectionHtml( res.sections['cart-count'], '.shopify-section' ) );

							setTimeout(
								function () {
									// Show side cart.
									document.documentElement.classList.add( 'side-cart-open' );
								}
							);
						}
					).catch(
						function ( e ) {
							console.error( e );
						}
					).finally(
						function () {
							// Re-init quantity.
							btyQuantityButton();

							// Re-init update quantity button.
							btyUpdateProductQuantity();

							// Remove loading animation.
							button.classList.remove( 'loading' );

							// Remove loading animation for quick add.
							let quickAddLoading = doc.querySelector( '.quick-add-box .field-item.loading' );
							if ( quickAddLoading ) {
								quickAddLoading.classList.remove( 'loading' );
							}

							document.documentElement.classList.remove( 'quick-view-open' );
							btyClosePopup( 'side-cart-open', document.querySelector( '.side-cart' ) );

							// Focus cart drawer.
							let sideCart    = document.querySelector( '.side-cart' ),
								closeButton = sideCart ? sideCart.querySelector( '.side-cart-close' ) : false;
							if ( closeButton ) {
								setTimeout(
									function () {
										closeButton.focus();
									},
									400
								);
							}
						}
					);
			}
		}
	);
}

// Ajax add all set to cart.
function btyAddMultiProductToCart( doc = document ) {
	let selectors = doc.querySelectorAll( '.add-multiple-products' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let items = el.parentNode.querySelectorAll( '.product-card [name="id"]' );
			if ( ! items.length ) {
				return;
			}

			items.forEach(
				function ( item, index ) {
					item.addEventListener(
						'change',
						function () {
							let currentId = el.querySelector( '[data-index="' + index + '"]' );
							if ( currentId ) {
								currentId.value = item.value;
							}
						}
					);
				}
			);
		}
	);
}

// Check product inventory.
function btyProductInventory( doc = document, variants = {} ) {
	let variant   = {},
		quickAdds = doc.querySelectorAll( '.quick-add-box .field-swatch .selected' ),
		swatches  = doc.querySelector( '.product-swatches .selected' );
	if ( ! quickAdds.length && ! swatches ) {
		return;
	}

	let selected = btySelectedVariant( variant, variants );
}

/**
 * Update stock status
 *
 * @param  object variants The product variants.
 * @param  node   siblings The product card.
 */
function btyUpdateStockStatus( variants, card ) {
	let getSelected = card.querySelectorAll( '.field-swatch .selected' ),
		swatch      = card.querySelector( '.product-swatches .swatch.selected' );
	if ( getSelected.length ) {
		getSelected.forEach(
			function ( el ) {
				let current = {};

				// Check color variant.
				if ( swatch ) {
					current[ swatch.getAttribute( 'data-name' ) ] = swatch.getAttribute( 'data-value' );
				}

				// Get siblings to save 2 fix variant, ex: ABC ABD ABX ABY.
				let siblings = btySiblings(
					el.parentNode,
					function ( e ) {
						return e.classList.contains( 'field-swatch' );
					}
				);

				if ( siblings.length ) {
					siblings.forEach(
						function ( si ) {
							let siSelected = si.querySelector( '.selected' );
							if ( ! siSelected ) {
								return;
							}

							current[ siSelected.getAttribute( 'data-name' ) ] = siSelected.getAttribute( 'data-value' );
						}
					);
				}

				// Update stock status on quick add.
				let indexSelected = el.parentNode.querySelectorAll( '.field-item' );

				if (indexSelected.length) {
					let hasSoldOut      = false;
					let isSelectedValid = false;

					indexSelected.forEach((is) => {
						current[is.getAttribute( 'data-name' )] = is.getAttribute( 'data-value' );

						let selected = btySelectedVariant( current, variants );
						if (selected) {
							if (selected.available) {
								is.classList.remove( 'soldout' );
							} else {
								is.classList.add( 'soldout' );
								hasSoldOut = true;
							}
						} else {
							is.classList.add( 'soldout' );
							hasSoldOut = true;
						}

						// Check varitant hass class `selected`).
						if (is.classList.contains( 'selected' )) {
							isSelectedValid = ! is.classList.contains( 'soldout' );
						}
					});

					// check disabled form.
					let addToCartButton = el.closest( '.form-add-to-cart' )?.querySelector( 'button.add-to-cart-button' );
					if ( addToCartButton ) {
						if (isSelectedValid) {
							addToCartButton.removeAttribute( 'disabled' );
						} else {
							addToCartButton.setAttribute( 'disabled', 'disabled' );
						}
					}
				}

				// Update event click update class `selected`.
				indexSelected.forEach((is) => {
					is.addEventListener('click', function () {
						indexSelected.forEach((item) => item.classList.remove( 'selected' ));
						is.classList.add( 'selected' );
					});
				});
			}
		);
	}

	if ( swatch ) {
		swatch.parentNode.querySelectorAll( '.swatch' ).forEach(
			function ( el ) {
				let current = {};

				if ( getSelected.length ) {
					getSelected.forEach(
						function ( si ) {
							current[ si.getAttribute( 'data-name' ) ] = si.getAttribute( 'data-value' );
						}
					);
				}

				current[ el.getAttribute( 'data-name' ) ] = el.getAttribute( 'data-value' );

				let selected = btySelectedVariant( current, variants );
				if ( selected ) {
					if ( selected.available ) {
						el.classList.remove( 'soldout' );
					} else {
						el.classList.add( 'soldout' );
					}
				} else {
					el.classList.add( 'soldout' );
				}
			}
		);
	}
}

/**
 * Update stock status for product page
 *
 * @param  object variants The product variants.
 * @param  node   siblings The product card.
 */
function btyUpdateStockStatusProduct( variants, element ) {
	let getSelected = element.querySelectorAll( '.variant-field .field-value:checked' );
	if ( ! getSelected.length ) {
		return;
	}

	getSelected.forEach(
		function ( el ) {
			let current = {};

			// Get siblings to save 2 fix variant, ex: ABC ABD ABX ABY.
			let siblings = btySiblings(
				el.closest( '.variant-field' ),
				function ( e ) {
					return e.classList.contains( 'variant-field' );
				}
			);

			if ( siblings.length ) {
				siblings.forEach(
					function ( si ) {
						let siSelected = si.querySelector( '.field-value:checked' );
						if ( ! siSelected ) {
							return;
						}

						current[ siSelected.getAttribute( 'name' ) ] = siSelected.getAttribute( 'value' );
					}
				);
			}

			// Update stock status on quick add.
			let indexSelected = el.closest( '.variant-field' ).querySelectorAll( '.field-value' );
			if ( indexSelected.length ) {
				indexSelected.forEach(
					function ( is ) {
						let inputId = is.getAttribute( 'id' ),
							label   = inputId ? is.parentNode.querySelector( 'label[for="' + inputId + '"]' ) : false;

						if ( ! label ) {
							return;
						}

						current[ is.getAttribute( 'name' ) ] = is.getAttribute( 'value' );

						let selected = btySelectedVariant( current, variants );
						if ( selected ) {
							if ( selected.available ) {
								label.classList.remove( 'soldout' );
							} else {
								label.classList.add( 'soldout' );
							}
						} else {
							label.classList.add( 'soldout' );
						}
					}
				);
			}
		}
	);
}

// Quick add.
function btyQuickAdd(doc = document) {
	let selectors = doc.querySelectorAll( '.quick-add .field-item' );
	if ( ! selectors.length ) {
		return;
	}

	// Function to handle the logic for a selected element.
	const handleSelection = (el) => {
		let form = el.closest( '[data-type="add-to-cart-form"]' ),
			card = form.closest( '.product-card' );
		if ( ! card ) {
			return;
		}

		// Highlight selected.
		if ( ! el.classList.contains( 'selected' ) ) {
			let oldActive = el.parentNode.querySelector( '.field-item.selected' );
			if (oldActive) {
				oldActive.classList.remove( 'selected' );
			}
			el.classList.add( 'selected' );
		}

		// Update swatch and product details.
		let variants = form.querySelector( '[data-product-variants]' ),
			productId = form.querySelector( '[name="id"]' );

		if (productId && variants) {
			// Parse JSON.
			variants = btyJsonParse( variants.textContent );

			let variant_pick = {},
				quickAddSelected = card.querySelectorAll( '.quick-add-box .selected' );

			if ( quickAddSelected.length ) {
				quickAddSelected.forEach(( qas ) => {
					variant_pick[qas.getAttribute( 'data-name' )] = qas.getAttribute( 'data-value' );
				});
			}

			// Get option from Swatch.
			let selectedSwatch = card.querySelector( '.product-swatches .swatch.selected' );
			if (selectedSwatch) {
				variant_pick[selectedSwatch.getAttribute( 'data-name' )] = selectedSwatch.getAttribute( 'data-value' );
			}

			// Found selected variant.
			let selected = btySelectedVariant( variant_pick, variants );
			if (selected) {
				productId.value = selected.id;

				// Update stock status.
				btyUpdateStockStatus( variants, card );

				// Update product price.
				let price = card.querySelector( '.product-price' );
				if (price) {
					price.innerHTML = btyPriceHtml(
						selected.price,
						selected.compare_at_price,
						selected.unit_price,
						selected.unit_price_measurement
					);
				}

				if (selected.available) {
					// Update add-to-cart-button.
					let addToCartBtn = card.querySelector( '.add-to-cart-button' );
					if (addToCartBtn) {
						addToCartBtn.onclick = function () {
							form.querySelector( '[type="submit"]' ).click();
						};
					}
				}
			}
		}
	};

	// Run the handler on each element on load.
	selectors.forEach(( el ) => {
		handleSelection( el );
		el.onclick = function () {
			handleSelection( el );
		};
	});
}

// Swatch list.
function btySwatch( doc = document ) {
	let swatch = doc.querySelectorAll( '.product-card .swatch' );
	if ( ! swatch.length ) {
		return;
	}

	swatch.forEach(
		function ( el ) {
			el.onclick = function ( e ) {
				e.preventDefault();

				if ( el.classList.contains( 'selected' ) ) {
					return;
				}

				let swatchValue = el.parentNode.querySelector( '.swatch-selected' );
				if ( swatchValue ) {
					swatchValue.innerText = el.innerText.trim();
				}

				// Get wrapper.
				let card    = el.closest( '.product-card' ),
					wrapper = card.querySelector( '.product-media-wrap' );
				if ( ! wrapper ) {
					return;
				}

				// Get product image.
				let image = wrapper.querySelector( '.product-image img' );

				// Handle loading image.
				const imageLoadHandle = function ( dataSrc, main ) {
					if ( ! image ) {
						return;
					}

					let newImage     = new Image(),
						variationImg = el.getAttribute( 'data-key' ) || false,
						mainImg      = image.getAttribute( 'data-key' ) || false;

					newImage.crossOrigin = 'anonymous';

					// Main image.
					if ( main ) {
						variationImg = mainImg;
					}

					// Check local storage first.
					if ( sessionStorage.getItem( variationImg ) ) {
						image.src = sessionStorage.getItem( variationImg );
						image.removeAttribute( 'srcset' );
						return;
					}

					// Save main product image first.
					if ( 'string' !== typeof( image.getAttribute( 'data-loaded' ) ) && mainImg ) {
						let mainImage = new Image();

						mainImage.crossOrigin = 'anonymous';

						mainImage.onload = function () {
							let renderMainImage = btyGetImageSrc( mainImage );

							if ( mainImg ) {
								sessionStorage.setItem( mainImg, renderMainImage );
							}

							image.setAttribute( 'data-loaded', '' );
						}

						mainImage.src = image.src;
					}

					// Add loading animation.
					wrapper.classList.add( 'loading' );

					// Handle.
					newImage.onload = function () {
						wrapper.classList.remove( 'loading' );
						let renderImage = btyGetImageSrc( newImage );

						// Set final image src.
						image.src = renderImage;
						image.removeAttribute( 'srcset' );

						// Save image to local storage.
						if ( variationImg ) {
							sessionStorage.setItem( variationImg, renderImage );
						}
					}

					newImage.onerror = function () {
						wrapper.classList.remove( 'loading' );
					}

					// Set image src for 'newImage.onload' function handle.
					newImage.src = dataSrc;
				}

				// Get old selected.
				let oldActive = card.querySelector( '.swatch.selected' );
				if ( oldActive ) {
					oldActive.classList.remove( 'selected' );
				}

				// Set swatch selected.
				el.classList.add( 'selected' );

				// Update product image src.
				if ( image ) {
					let src = el.getAttribute( 'data-src' ) || '';
					if ( src && src != image.src ) {
						imageLoadHandle( src );
					}
				}

				// Update swatch.
				let form      = el.closest( '.product-card' ).querySelector( '[data-type="add-to-cart-form"]' ),
					addToCart = form ? form.querySelector( '.add-to-cart-button' ) : false,
					variants  = form ? form.querySelector( '[data-product-variants]' ) : false,
					productId = form ? form.querySelector( '[name="id"]' ) : false;

				if ( productId && variants ) {
					let variant_pick = {},
						dataName     = el.getAttribute( 'data-name' ),
						dataValue    = el.getAttribute( 'data-value' );

					variants = btyJsonParse( variants.textContent );

					variant_pick[ dataName ] = dataValue;

					// Update stock status.
					btyUpdateStockStatus( variants, card );

					// Get quick add value.
					let quickAdd = card.querySelectorAll( '.quick-add .field-item.selected' );
					if ( quickAdd.length ) {
						quickAdd.forEach(
							function ( qa ) {
								variant_pick[ qa.getAttribute( 'data-name' ) ] = qa.getAttribute( 'data-value' );
							}
						);
					}

					let selected = btySelectedVariant( variant_pick, variants );
					if ( selected ) {
						productId.value = selected.id;

						// Dispatch 'change' event.
						productId.dispatchEvent( new Event( 'change' ) );

						// Update add to cart button status.
						if ( addToCart ) {
							if ( selected.available ) {
								addToCart.classList.remove( 'disabled' );
							} else {
								addToCart.classList.add( 'disabled' );
							}
						}

						// Update product url.
						let ahref = el.closest( '.product-card' ).querySelectorAll( 'a[href]:not(.swatch)' );
						if ( ahref.length ) {
							ahref.forEach(
								function ( link ) {
									link.setAttribute( 'href', link.href.split( '?' )[1] ? link.href.split( '?' )[0] + '?variant=' + selected.id : link.href + '?variant=' + selected.id );
								}
							);
						}
					}
				}
			}
		}
	);
}

// Product tabs.
function btyProductTabs( doc = document, event = {} ) {
	let selectors = doc.querySelectorAll( '.tabs .tab-head' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let wrap  = el.closest( '.tabs' ),
				index = el.getAttribute( 'data-index' ),
				tab   = wrap.querySelector( '.tab-content[data-index="' + index + '"]' );

			if ( ! tab ) {
				return;
			}

			// For design mode.
			if ( Shopify.designMode && Object.keys( event ).length ) {
				let currentTab = doc.querySelector( '.tab-head[data-id="' + event.detail.blockId + '"]' );
				if ( currentTab ) {
					currentTab.click();
				}
			}

			function updateButtonUrl() {
				let navActived = wrap.querySelector( '.tab-head.active' ),
					collectionButton = wrap.querySelector('.collection-button');

				if (navActived && collectionButton) {
					let collectionUrl = navActived.dataset.collectionUrl;
					if (collectionUrl) {
						collectionButton.href = collectionUrl;
					}
				}
			}

			el.addEventListener(
				'click',
				function () {
					if ( el.classList.contains( 'active' ) ) {
						return;
					}

					let navActived = wrap.querySelector( '.tab-head.active' ),
						tabActived = wrap.querySelector( '.tab-content.active' );

					if ( navActived ) {
						navActived.classList.remove( 'active' );
						setTimeout(updateButtonUrl, 100);
					}

					if ( tabActived ) {
						tabActived.classList.remove( 'active' );
					}

					el.classList.add( 'active' );
					tab.classList.add( 'active' );
				}
			);
		}
	);

	let dropdown = doc.querySelectorAll( '.dropdown-content li' );
	if ( dropdown.length ) {
		dropdown.forEach(
			function ( el ) {
				el.addEventListener(
					'click',
					function () {
						let parent  = el.closest( '.tabs' ),
							current = parent.querySelector( '.tab-head[data-index="' + el.getAttribute( 'data-index' ) + '"]' );
						if ( ! current ) {
							return;
						}

						current.click();
					}
				);
			}
		);
	}
}

// Video.
function btyVideo( doc = document ) {
	let selectors = doc.querySelectorAll( '.video-item' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let imageWrapper = el.querySelector( '.video-image-wrapper' );

			if ( ! imageWrapper ) {
				return;
			}

			imageWrapper.addEventListener(
				'click',
				function () {
					let iframe = el.querySelector( 'iframe' ),
						video  = el.querySelector( 'video' );

					if ( iframe ) {
						iframe.src = iframe.getAttribute( 'data-src' );

						btyMediaAction( el, 'play' );
					}

					if ( video ) {
						video.setAttribute( 'data-ready', '' );

						let playPromise = video.play();
						if ( undefined !== playPromise ) {
							playPromise.then(
								function () {}
							).catch(
								function ( error ) {
									console.log( error );
								}
							);
						}
					}
				}
			);
		}
	);
}

// Video background.
function btyBackgroundVideo( doc = document ) {
	let selectors = doc.querySelectorAll( '.toggle-popup-bg-video' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			el.addEventListener(
				'click',
				function () {
					let section = el.closest( '.video-background-section' ),
						popup   = section ? section.querySelector( '.background-video-popup' ) : false,
						iframe  = popup ? popup.querySelector( 'iframe' ) : false,
						video   = popup ? popup.querySelector( 'video' ) : false;

					if ( ! popup ) {
						return;
					}

					document.documentElement.classList.add( 'bg-video-popup-open' );
					btyClosePopup( 'bg-video-popup-open', popup );

					if ( iframe ) {
						iframe.src = iframe.getAttribute( 'data-src' );

						btyMediaAction( popup, 'play' );
					}

					if ( video ) {
						video.setAttribute( 'data-ready', '' );

						let playPromise = video.play();
						if ( undefined !== playPromise ) {
							playPromise.then(
								function () {}
							).catch(
								function ( error ) {
									console.log( error );
								}
							);
						}
					}
				}
			);
		}
	);
}

// Action for media.
function btyMediaAction( doc = document, type = 'pause' ) {
	let video = doc.querySelectorAll( '.js-youtube, .js-vimeo, video' );
	if ( ! video.length ) {
		return;
	}

	let youtubeFunc = 'stopVideo';

	switch ( type ) {
		case 'pause':
			youtubeFunc = 'pauseVideo';
			break;
		case 'play':
			youtubeFunc = 'playVideo';
			break;
		case 'stop':
			youtubeFunc = 'stopVideo';
			break;
	}

	if ( video.length ) {
		video.forEach(
			function ( vd ) {
				if ( 'video' === vd.tagName.toLowerCase() ) {
					let playPromise = vd.play();

					if ( 'pause' === type ) {
						if ( undefined !== playPromise ) {
							playPromise.then(
								function () {
									vd.pause();
								}
							).catch(
								function ( error ) {
									console.log( error );
								}
							);
						}
					} else {
						if ( undefined !== playPromise ) {
							playPromise.then(
								function () {}
							).catch(
								function ( error ) {
									console.log( error );
								}
							);
						}
					}
				} else if ( vd.classList.contains( 'js-youtube' ) ) {
					vd.contentWindow.postMessage( '{"event":"command","func":"' + youtubeFunc + '","args":""}', '*' );
				} else if ( vd.classList.contains( 'js-vimeo' ) ) {
					vd.contentWindow.postMessage( '{"method":"' + type + '"}', '*' );
				}
			}
		);
	}
}

// Address box section.
function btyAddress( doc =document ) {
	let selectors = doc.querySelectorAll( '.address-box .address-summary' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let items = el.querySelectorAll( '.summary-item' );
			if ( items.length < 2 ) {
				return;
			}

			items.forEach(
				function ( im, index ) {
					im.addEventListener(
						'click',
						function ( e ) {
							e.preventDefault();

							const mobile = window.matchMedia( '(max-width: 767px)' ).matches;

							let oldActive = el.querySelector( '.summary-item.active' ),
								subBox    = im.querySelector( '.address-sub' ),
								image     = el.parentNode.querySelector( '.address-content-inner' );

							if ( im.classList.contains( 'active' ) ) {
								return;
							}

							if ( oldActive ) {
								let oldSubBox = oldActive.querySelector( '.address-sub' );
								if ( oldSubBox && mobile ) {
									btySlideUp( oldSubBox );
								}
								oldActive.classList.remove( 'active' );
							}

							if ( image ) {
								image.setAttribute( 'data-level', index );
							}

							im.classList.add( 'active' );

							if ( subBox && mobile ) {
								btySlideDown( subBox );
							}
						}
					);
				}
			);
		}
	);
}

// Pickup availability.
function btyPickupAvailability( doc = document, variant_id = false, pickup = false ) {
	let panel = document.querySelector( '.pickup-availability-panel' );
	if ( ! pickup || ! panel ) {
		return;
	}

	fetch( '/variants/' + variant_id + '?section_id=pickup-availability' )
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
				pickup.innerHTML = btyGetSectionHtml( res, '.pickup-availability-info', 'outer' );
				panel.innerHTML  = btyGetSectionHtml( res, '.pickup-availability-modal', 'outer' );

				let toggle = pickup.querySelector( '.toggle-modal' );
				if ( toggle ) {
					toggle.onclick = function () {
						document.documentElement.classList.add( 'pickup-availability-open' );

						btyClosePopup( 'pickup-availability-open', panel );
					}
				}
			}
		).catch(
			function ( e ) {
				console.error( e );
			}
		);
}

// Pickup availability for simple product.
function btyPickupAvailabilityInit( doc = document ) {
	let variants = doc.querySelectorAll( '.product-variants' );
	if ( variants.length ) {
		return;
	}

	let inner     = doc.querySelector( '.product-summary-inner[data-selected-id]' ),
		pickup    = doc.querySelector( '.pickup-availability' ),
		productId = inner ? inner.getAttribute( 'data-selected-id' ) : false;

	if ( ! pickup || ! productId ) {
		return;
	}

	btyPickupAvailability( doc, productId, pickup );
}

// Popup content.
function btyProductPopup( doc = document ) {
	let selectors = doc.querySelectorAll( '.product-popup' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let summary = el.closest( '.product-summary' ),
				button  = el.querySelector( '.popup-toggle' ),
				view    = el.querySelector( '.popup-view' ),
				close   = el.querySelector( '.popup-close' );

			if ( ! summary || ! button || ! view || ! close ) {
				return;
			}

			button.onclick = function () {
				summary.classList.add( 'open' );

				// Target.
				view.onclick = function ( e ) {
					if ( view !== e.target ) {
						return;
					}

					summary.classList.remove( 'open' );
				}

				// Use ESC key.
				document.addEventListener(
					'keyup',
					function ( e ) {
						if ( 27 !== e.keyCode ) {
							return;
						}

						summary.classList.remove( 'open' );
					}
				);

				// Use close button.
				close.onclick = function () {
					summary.classList.remove( 'open' );
				}
			}
		}
	);
}

// Share button.
function btyProductShare( doc = document ) {
	let selector = doc.querySelector( '.product-share[data-os]' );
	if ( ! selector ) {
		return;
	}

	let button  = selector.querySelector( '.share-button' ),
		summary = selector.querySelector( 'summary' ),
		input   = selector.querySelector( '.field-input' ),
		message = selector.querySelector( '.share-message' ),
		copy    = selector.querySelector( '.share-button-copy' ),
		close   = selector.querySelector( '.share-button-close' );

	if ( ! button || ! summary || ! copy || ! close ) {
		return;
	}

	let closeAction = function () {
		summary.parentNode.removeAttribute( 'open' );
		close.classList.add( 'hidden' );
		message.classList.add( 'hidden' );
		message.textContent = '';
	}

	if ( navigator.share ) {
		button.classList.remove( 'hidden' );
		button.onclick = function () {
			navigator.share(
				{
					url: document.location.href,
					title: document.title
				}
			);
		}
	} else {
		summary.classList.remove( 'hidden' );

		copy.onclick = function () {
			navigator.clipboard.writeText( input.value ).then(
				function () {
					message.classList.remove( 'hidden' );
					close.classList.remove( 'hidden' );

					message.textContent = btyStrings.general.share_success;
				}
			);
		}

		// Click any to close.
		document.addEventListener(
			'click',
			function ( e ) {
				if ( e.target.closest( '.product-share' ) ) {
					return;
				}

				closeAction();
			}
		);

		// Use ESC key.
		document.addEventListener(
			'keyup',
			function ( e ) {
				if ( 27 !== e.keyCode ) {
					return;
				}

				closeAction();
			}
		);

		// Close button.
		close.onclick = closeAction;
	}
}

// Sale notification.
function btySalesNotification( doc = document ) {
	let selector = doc.querySelector( '.sales-notification' );
	if ( ! selector ) {
		return;
	}

	let inner   = selector.querySelector( '.sn-inner' ),
		options = selector.querySelector( '[data-options]' ),
		items   = selector.querySelector( '[data-items]' );
	if ( ! inner || ! options || ! items ) {
		return;
	}

	let parseOptions = btyJsonParse( options.content.textContent ),
		parseItems   = new DOMParser().parseFromString( items.innerHTML, 'text/html' );

	// Remove html template.
	options.remove();
	items.remove();

	let length = parseItems.querySelectorAll( '.sn-item' );
	if ( ! length.length ) {
		return;
	}

	// Get random item in array.
	const randomItem = function ( arr = [] ) {
		return arr[ Math.floor( Math.random() * arr.length ) ];
	}

	// Display function.
	const displayFn = function () {
		let item     = randomItem( length ),
			time     = item.querySelector( '.sn-time' ),
			customer = item.querySelector( '.sn-customer' );

		// Append time text.
		if ( time ) {
			time.innerText = randomItem( parseOptions.virtual_times );
		}

		// Append customer text.
		if ( customer ) {
			customer.innerText = randomItem( parseOptions.virtual_customers ) + parseOptions.purchased;
		}

		inner.innerHTML = item.outerHTML;

		let current = inner.querySelector( '.sn-item' );
		if ( ! current ) {
			return;
		}

		// Set animation.
		setTimeout(
			function () {
				current.classList.add( 'active' );
			},
			50
		);

		// Start loading bar when animation end.
		setTimeout(
			function () {
				current.insertAdjacentHTML( 'beforeend', '<span class="underline-animated' + ( parseOptions.loading_bar ? '' : ' visibility-hidden' ) + '"></span>' );

				// Remove notification after animation end.
				let animation = current.querySelector( '.underline-animated' );
				if ( animation ) {
					animation.addEventListener(
						'animationend',
						function () {
							current.classList.add( 'down' );
						}
					);
				}
			},
			300
		);

		// Remove notification by click to Close button.
		let closeBtn = current.querySelector( '.sn-close' );
		if ( closeBtn ) {
			closeBtn.onclick = function () {
				current.classList.add( 'down' );
			}
		}
	}

	let init, timeTotal = parseOptions.time_total * 1000;
	setTimeout(
		function () {
			displayFn();

			init = setInterval( displayFn, timeTotal );
		},
		( parseOptions.time_init * 1000 )
	);
}

// Newsletter popup.
function btyNewsletterPopup( doc = document ) {
	let form = doc.querySelector( '.newsletter-popup-form' );
	if ( ! form ) {
		return;
	}

	let delay = form.getAttribute( 'data-delay' );

	setTimeout(
		function() {
			// Always show popup when Display mode set to Test mode.
			if ( Shopify.designMode && '' === form.getAttribute( 'data-mode' ) ) {
				form.parentNode.classList.add( 'closed' );
			} else {
				if ( 'test' === form.getAttribute( 'data-mode' ) ) {
					form.parentNode.classList.remove( 'closed' );
				} else {
					if ( form.classList.contains( 'first-visit' ) ) {
						const getCookie = new URLSearchParams( document.cookie.replaceAll( '&', '%26' ).replaceAll( '; ', '&' ) );
						if ( ! getCookie.get( 'newsletter-popup-cookie' ) ) {
							form.parentNode.classList.remove( 'closed' );
						}

						function setCookie( cname, cvalue, exdays ) {
							let d = new Date();

							d.setTime( d.getTime() + ( exdays * 24 * 60 * 60 * 1000) );

							let expires = 'expires=' + d.toUTCString();

							document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
						}

						setCookie( 'newsletter-popup-cookie', 1, 30 );
					} else {
						form.parentNode.classList.remove( 'closed' );
					}
				}
			}

			// Click to popup overlay.
			form.addEventListener(
				'click',
				function( e ) {
					if ( e.target != form ) {
						return;
					}

					form.parentNode.classList.add( 'closed' );
				}
			);

			// Use ESC key.
			document.addEventListener(
				'keyup',
				function( e ) {
					if ( 27 !== e.keyCode ) {
						return;
					}

					form.parentNode.classList.add( 'closed' );
				}
			);

			// Use close button.
			let button = form.querySelector( '.close-button' );
			if ( button ) {
				button.onclick = function() {
					form.parentNode.classList.add( 'closed' );
				}
			}
		},
		Number( delay )
	);
}

// Age verification popup.
function btyAgeverificationPopup(doc = document) {
	// Function to check the cookies.
	function checkAgeVerification() {
		const cookieString = doc.cookie && doc.cookie.split('; ').find(row => row.startsWith('acceptAgeVerification='));
		if ( ! cookieString || Shopify.designMode ) {
			let allowSection = doc.querySelector( ".age-verification-section .allow" );
			if (allowSection) {
				allowSection.classList.remove( "hidden" );
			}
		}
	}

	// Function to set the cookie.
	function setCookie(name, value, days) {
		const d = new Date();
		d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
		const expires = "expires=" + d.toUTCString();
		doc.cookie = `${name}=${value};${expires};path=/`;
	}

	// Check and attach event to the "Yes" button.
	let yesBtn = doc.querySelector( ".age-verification-section .yes-btn" );

	if (yesBtn) {
		yesBtn.addEventListener("click", function () {
			let allowSection = doc.querySelector( ".age-verification-section .allow" );
			if (allowSection) {
				allowSection.classList.add( "hidden" );
			}
			// Add 'closed' class and set cookie when clicking "Yes".
			let form = doc.querySelector( '.age-verification-section .newsletter-popup-form' );
			if (form) {
				form.parentNode.classList.add( 'closed' );
			}
			setCookie( 'acceptAgeVerification', 1, 30 );
		});
	}

	// Check and attach event to the "No" button.
	let noBtn = doc.querySelector( ".age-verification-section .no-btn" );
	if (noBtn) {
		noBtn.addEventListener("click", function () {
			let allowSection    = doc.querySelector( ".age-verification-section .allow" );
			let notAllowSection = doc.querySelector( ".age-verification-section .not-allow" );
			if (allowSection && notAllowSection) {
				allowSection.classList.add( "hidden" );
				notAllowSection.classList.remove( "hidden" );
			}
		});
	}

	// Check and attach event to the "Back" button.
	let backBtn = doc.querySelector( ".age-verification-section .back-btn" );
	if (backBtn) {
		backBtn.addEventListener("click", function () {
			let notAllowSection = doc.querySelector( ".age-verification-section .not-allow" );
			let allowSection    = doc.querySelector( ".age-verification-section .allow" );
			if (notAllowSection && allowSection) {
				notAllowSection.classList.add( "hidden" );
				allowSection.classList.remove( "hidden" );
			}
		});
	}

	// Call the cookie check function.
	checkAgeVerification();
}

// Cookies bar.
function btyCookiesBar( doc = document ) {
	let box    = doc.querySelector( '.cookies-bar' ),
		button = doc.querySelector( '.button-cookies' );

	if ( ! box || ! button || ( Shopify.designMode && '' === box.getAttribute( 'data-mode' ) ) ) {
		return;
	}

	const getCookie = new URLSearchParams( document.cookie.replaceAll( '&', '%26' ).replaceAll( '; ', '&' ) );
	if ( ! getCookie.get( 'acceptCookies' ) ) {
		box.classList.add( 'show' );
	}

	function setCookie( cname, cvalue, exdays ) {
		let d = new Date();

		d.setTime( d.getTime() + ( exdays * 24 * 60 * 60 * 1000) );

		let expires = 'expires=' + d.toUTCString();

		document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
	}

	button.onclick = function () {
		if ( '' === box.getAttribute( 'data-mode' ) ) {
			setCookie( 'acceptCookies', 1, 30 );
		} else {
			document.cookie = 'acceptCookies=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		}

		box.classList.remove( 'show' );
	}
}

// Hover media video.
function btyHoverMediaVideo( doc = document ) {
	let selectors = doc.querySelectorAll( '.hover-media-video' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let parent = el.parentNode;
		}
	);
}


// Animation for image.
function btyAnimationImageLoad( doc = document, delay = 0 ) {
	const images = doc.querySelectorAll( '.lazy-image img' );

	if ( images.length === 0 ) {
		return;
	}

	const observer = new IntersectionObserver(( entries, obs ) => {
		entries.forEach(( entry ) => {
			if (entry.isIntersecting) {
				const img = entry.target;

				if (img.closest( '.animated-image-collage' )) {
					return;
				}

				if (img.dataset.src) {
					img.src = img.dataset.src;
				}
				if (img.dataset.srcset) {
					img.srcset = img.dataset.srcset;
				}

				img.removeAttribute( 'data-src' );
				img.removeAttribute( 'data-srcset' );

				setTimeout(() => {
					if ( img.parentNode ) {
						img.parentNode.classList.add( 'lazy-loaded' );
					}
				}, delay);

				obs.unobserve( img );
			}
		});
	}, { rootMargin: '50px' });

	images.forEach(( img ) => observer.observe( img ));
}

// Animation for animated-image-collage.
function btyAnimationCollageLoad(doc = document) {
	const sections = doc.querySelectorAll( '.animated-image-collage' );

	if ( sections.length === 0 ) {
		return;
	}

	const observer = new IntersectionObserver(( entries, obs ) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const section = entry.target;

				section.querySelectorAll( '.lazy-image img' ).forEach(( img ) => {
					if (img.dataset.src) {
						img.src = img.dataset.src;
					}
					if (img.dataset.srcset) {
						img.srcset = img.dataset.srcset;
					}
					img.removeAttribute( 'data-src' );
					img.removeAttribute( 'data-srcset' );

					if (img.parentNode) {
						img.parentNode.classList.add( 'lazy-loaded' );
					}
				});

				obs.unobserve( section );
			}
		});
	}, { rootMargin: '50px' });

	sections.forEach(( section ) => observer.observe( section ));
}

// Collection sticky.
function btyCollectionSticky( doc = document ) {
	let items = doc.querySelectorAll( '.collection-sticky' );
	if ( ! items.length ) {
		return
	}

	const stickCollection = function () {
		items.forEach(
			function ( el ) {
				let box        = el.querySelector( '.heading-box' ),
					subHeading = box ? box.querySelector( '.sub-heading .dynamic-label' ) : false,
					heading    = box ? box.querySelector( '.heading .dynamic-label' ) : false,
					button     = box ? box.querySelector( '.collection-list-button .dynamic-label' ) : false,
					cards      = el.querySelectorAll( '.card-item' );
				if ( ! cards.length ) {
					return;
				}

				for ( let i = 0, j = cards.length; i < j; i++ ) {
					let rect    = cards[i].getBoundingClientRect(),
						index   = i + 1,
						current = el.querySelector( '.card-item:nth-child(' + index + ')' );

					if ( ! current ) {
						return;
					}

					let title          = current.getAttribute( 'data-title' ),
						dataSubHeading = current.getAttribute( 'data-subheading' ),
						dataHeading    = current.getAttribute( 'data-heading' ),
						href           = current.getAttribute( 'data-href' );
					if ( rect.top <= 1 && ( rect.top >= rect.height * -1 ) ) {
						if ( button && button.innerText != title ) {
							if ( href.trim() ) {
								button.parentNode.href = href;
							}

							if ( title.trim() ) {
								button.innerText = title;
							}

							button.parentNode.classList.add( 'bounce-it' );
							setTimeout(
								function () {
									button.parentNode.classList.remove( 'bounce-it' );
								},
								1000
							);
						}

						if ( dataSubHeading.trim() && subHeading ) {
							subHeading.innerText = dataSubHeading;
						}

						if ( dataHeading.trim() && heading ) {
							heading.innerText = dataHeading;
						}
					}
				}
			}
		);
	}

	stickCollection();

	// Trigger.
	window.addEventListener(
		'scroll',
		function () {
			stickCollection();
		}
	);
}

// Google map.
function btyGoogleMap( doc = document ) {
	let selectors = doc.querySelectorAll( '.contact-map' );
	if ( ! selectors.length ) {
		return;
	}

	// Map style.
	let styledMapType = new google.maps.StyledMapType(
		[
			{
				"featureType": "administrative",
				"elementType": "labels.text.fill",
				"stylers": [{ "color": "#444444" }]
			},
			{
				"featureType": "administrative.land_parcel",
				"elementType": "all",
				"stylers": [{ "visibility": "off" }]
			},
			{
				"featureType": "landscape",
				"elementType": "all",
				"stylers": [{ "color": "#f2f2f2" }]
			},
			{
				"featureType": "landscape.natural",
				"elementType": "all",
				"stylers": [{ "visibility": "off" }]
			},
			{
				"featureType": "poi",
				"elementType": "all",
				"stylers": [
					{ "visibility": "on" },
					{ "color": "#052366" },
					{ "saturation": "-70" },
					{ "lightness": "85" }
				]
			},
			{
				"featureType": "poi",
				"elementType": "labels",
				"stylers": [
					{ "visibility": "simplified" },
					{ "lightness": "-53" },
					{ "weight": "1.00" },
					{ "gamma": "0.98" }
				]
			},
			{
				"featureType": "poi",
				"elementType": "labels.icon",
				"stylers": [{ "visibility": "simplified" }]
			},
			{
				"featureType": "road",
				"elementType": "all",
				"stylers": [
					{ "saturation": -100 },
					{ "lightness": 45 },
					{ "visibility": "on" }
				]
			},
			{
				"featureType": "road",
				"elementType": "geometry",
				"stylers": [{ "saturation": "-18" }]
			},
			{
				"featureType": "road",
				"elementType": "labels",
				"stylers": [{ "visibility": "off" }]
			},
			{
				"featureType": "road.highway",
				"elementType": "all",
				"stylers": [{ "visibility": "on" }]
			},
			{
				"featureType": "road.arterial",
				"elementType": "all",
				"stylers": [{ "visibility": "on" }]
			},
			{
				"featureType": "road.arterial",
				"elementType": "labels.icon",
				"stylers": [{ "visibility": "off" }]
			},
			{
				"featureType": "road.local",
				"elementType": "all",
				"stylers": [{ "visibility": "on" }]
			},
			{
				"featureType": "transit",
				"elementType": "all",
				"stylers": [{ "visibility": "off" }]
			},
			{
				"featureType": "water",
				"elementType": "all",
				"stylers": [
					{ "color": "#57677a" },
					{ "visibility": "on" }
				]
			}
		],
		{ name: "Styled Map" }
	);

	// Init.
	selectors.forEach(
		function ( el ) {
			let data    = el.querySelector( '[data-options]' ),
				options = data ? btyJsonParse( data.content.textContent ) : false;
			if ( ! options ) {
				return;
			}

			// Remove template.
			data.remove();

			let coordinates = options.coordinates.split( ',' );

			coordinates = { lat: Number( coordinates[0].trim() ), lng: Number( coordinates[1].trim() ) }

			let map = new google.maps.Map(
				el,
				{
					zoom: options.zoom,
					center: coordinates,
					disableDefaultUI: true,
					mapTypeControlOptions: {
						mapTypeIds: [ 'roadmap', 'satellite', 'hybrid', 'terrain', 'styled_map' ]
					}
				}
			);

			map.mapTypes.set( 'styled_map', styledMapType );
			map.setMapTypeId( 'styled_map' );

			let marker = new google.maps.Marker(
				{
					position: coordinates,
					map: map
				}
			);
		}
	);
}

// Recipient form.
function btyRecipientForm( doc = document ) {
	let input  = doc.querySelector( '.recipient-checkbox-label input[type="checkbox"]' ),
		fields = doc.querySelector( '.recipient-fields' );

	if ( ! input || ! fields ) {
		return;
	}

	input.onchange = function () {
		if ( input.checked ) {
			fields.classList.add( 'open' );
		} else {
			fields.classList.remove( 'open' );
		}
	}
}

// Load media.
function btyLoadMedia( selector = undefined, action = 'play' ) {
	if ( ! selector ) {
		return;
	}

	let wrapper = selector.querySelector( '.media-preview-wrap' ),
		playBtn = selector.querySelector( '.view-media' );

	if ( ! playBtn ) {
		return;
	}

	// Return if media loaded.
	if ( wrapper.classList.contains( 'media-loaded' ) ) {
		btyMediaAction( wrapper, action );

		return;
	}

	// Play current video.
	btyMediaAction( wrapper, action );

	let template = selector.querySelector( 'template' ),
		mediaDiv = wrapper.querySelector( '.media-content' );

	if ( ! mediaDiv ) {
		wrapper.classList.add( 'media-loaded' );

		if ( template ) {
			wrapper.insertAdjacentHTML( 'beforeend', '<div class="media-content">' + template.innerHTML + '</div>' );
		}
	}

	// Remove model after loaded, inside <template> tag.
	if ( template ) {
		template.remove();
	}
}

// Load media on desktop.
function btyMediaDesktop( doc = document ) {
	let selectors = doc.querySelectorAll( '.main-item' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			if ( el.hasAttribute( 'data-model' ) ) {
				return;
			}
		}
	);
}
// Animation for accordion.
class btyAccordion {
	constructor( el, toggle = 'summary', view = '.details-content' ) {
		const accordion = this;

		accordion.el      = el;
		accordion.summary = el.querySelector( toggle );
		accordion.content = el.querySelector( view );

		accordion.animation   = null;
		accordion.isClosing   = false;
		accordion.isExpanding = false;

		if ( ! accordion.content ) {
			return;
		}

		accordion.summary.addEventListener(
			'click',
			function ( e ) {
				accordion.onClick( e );
			}
		);
	}

	onClick(e) {
		e.preventDefault();
		const accordion = this;

		accordion.el.style.overflow = 'hidden';

		let aria = accordion.summary.getAttribute( 'aria-expanded' );

		if ( accordion.isClosing || ! accordion.el.open ) {
			accordion.open();

			if ( aria ) {
				accordion.summary.setAttribute( 'aria-expanded', 'true' );
			}
		} else if ( accordion.isExpanding || accordion.el.open ) {
			accordion.shrink();

			if ( aria ) {
				accordion.summary.setAttribute( 'aria-expanded', 'false' );
			}
		}
	}

	shrink() {
		const accordion = this;

		accordion.isClosing = true;

		let startHeight = accordion.el.offsetHeight + 'px',
			endHeight   = accordion.summary.offsetHeight + 'px';

		if ( accordion.animation ) {
			accordion.animation.cancel();
		}

		accordion.animation = accordion.el.animate(
			{
				height: [startHeight, endHeight]
			},
			{
				duration: 200,
				easing: 'ease-out'
			}
		);

		accordion.animation.onfinish = function () {
			accordion.onAnimationFinish( false );
		}

		accordion.animation.oncancel = function () {
			accordion.isClosing = false;
		}
	}

	open() {
		const accordion = this;

		accordion.el.style.height = accordion.el.offsetHeight + 'px';
		accordion.el.open         = true;

		window.requestAnimationFrame(
			function () {
				accordion.expand();
			}
		);
	}

	expand() {
		const accordion = this;

		accordion.isExpanding = true;

		let startHeight = accordion.el.offsetHeight + 'px',
			endHeight   = ( accordion.summary.offsetHeight + accordion.content.offsetHeight ) + 'px';

		if (accordion.animation) {
			accordion.animation.cancel();
		}

		accordion.animation = accordion.el.animate(
			{
				height: [startHeight, endHeight]
			},
			{
				duration: 200,
				easing: 'ease-out'
			}
		);

		accordion.animation.onfinish = function () {
			accordion.onAnimationFinish( true );
		}

		accordion.animation.oncancel = function () {
			accordion.isExpanding = false;
		}
	}

	onAnimationFinish(open) {
		const accordion = this;

		accordion.el.open     = open;
		accordion.animation   = null;
		accordion.isClosing   = false;
		accordion.isExpanding = false;

		accordion.el.removeAttribute( 'style' );
	}
}

function btyAccordionHandle( doc = document ) {
	let details = doc.querySelectorAll( 'details' );
	if ( ! details.length ) {
		return;
	}

	details.forEach(
		function ( el ) {
			// No apply effect for motion reduce node.
			if ( el.hasAttribute( 'data-motion-reduce' ) ) {
				return;
			}

			new btyAccordion( el );
		}
	);
}

// Accordion hover.
function btyAccordionHover( doc = document ) {
	let menus = doc.querySelectorAll( '.menu-map.faq-accordion' );

	if ( ! menus.length ) {
		return;
	}

	menus.forEach(
		function ( el ) {
			let section   = el.closest( '.shopify-section' ),
				id        = el.getAttribute( 'data-id' ),
				container = section?section.querySelectorAll( '.content-map[data-id="' + id + '"]' ) : [];

			el.addEventListener(
				'mouseenter',
				function () {
					if ( window.matchMedia( '(max-width: 991px)' ).matches || window.matchMedia( '(hover: none)' ).matches ) {
						return;
					}

					if ( container.length ) {
						container.forEach(
							function ( con ) {
								let sibs = btySiblings( con );
								if ( sibs.length ) {
									sibs.forEach(
										function ( sib ) {
											sib.classList.remove( 'active' );
										}
									);
								}

								con.classList.add( 'active' );
							}
						);
					}
				}
			);
		}
	);
}

// Footer accordion.
function btyFooterAccordion( doc = document ) {
	let headings = doc.querySelectorAll( '.ft-block-heading' );
	if ( ! headings.length ) {
		return;
	}

	headings.forEach(
		function ( el ) {
			let block = el.parentNode.querySelector( '.ft-block-content' );
			if ( ! block ) {
				return;
			}

			if ( window.matchMedia( '(min-width: 992px)' ).matches ) {
				el.parentNode.classList.remove( 'open' );
				block.removeAttribute( 'style' );

				return;
			}

			el.onclick = function () {
				if ( window.matchMedia( '(min-width: 992px)' ).matches ) {
					return;
				}

				if ( 'none' === window.getComputedStyle( block ).display ) {
					btySlideDown( block );
					el.parentNode.classList.add( 'open' );
				} else {
					btySlideUp( block );
					el.parentNode.classList.remove( 'open' );
				}
			}
		}
	);
}

// Scroll in animation logic.
function btyIntersection( elements, observer ) {
	const offscreen = 'scroll-trigger-offscreen';

	elements.forEach(
		( el, index ) => {
			if ( el.isIntersecting ) {
				const target = el.target;

				if ( target.classList.contains( offscreen ) ) {
					target.classList.remove( offscreen );

					target.setAttribute( 'style', '--animation-order: ' + index + ';' );
				}

				observer.unobserve( target );
			} else {
				el.target.classList.add( offscreen );
			}
		}
	);
}

// Scroll trigger.
function btyScrollAnimationTrigger( doc = document, designMode = false ) {
	const selectors = Array.from( doc.getElementsByClassName( 'scroll-trigger' ) );
	if ( ! selectors.length ) {
		return;
	}

	if ( designMode ) {
		selectors.forEach(
			( el ) => {
				el.classList.add( 'scroll-trigger-design-mode' );
			}
		);

		return;
	}

	const observer = new IntersectionObserver(
		btyIntersection,
		{
			rootMargin: '0px 0px -20px 0px',
		}
	);

	selectors.forEach( ( el ) => observer.observe( el ) );
}

// Slider.
const btySliderInstances = {};
function btySlider( doc = document, event = {} ) {
	let selectors = doc.querySelectorAll( '.theme-slider .swiper' );
	if ( ! selectors.length || 'undefined' === typeof( Swiper ) ) {
		return;
	}

	let isMobile = window.matchMedia( '(max-width: 991px)' ).matches || window.matchMedia( '(hover: none)' ).matches;

	selectors.forEach(
		function ( el ) {
			let section      = el.closest( '.slider-section' ),
				sectionId    = section?section.id.replace( 'shopify-section-', '' ) : false,
				data         = section?section.querySelector( '[data-slider]' ) : false,
				initialSlide = 0;

			if ( ! sectionId ) {
				return;
			}

			// For design mode.
			if ( Shopify.designMode ) {
				let current = Object.keys( event ).length?el.querySelector( '.swiper-slide[data-' + event.detail.blockId + ']' ) : false;
				if ( current ) {
					initialSlide = Array.from( current.parentNode.children ).indexOf( current );
				}

				if ( 'undefined' !== typeof( btySliderInstances[sectionId] ) ) {
					btySliderInstances[sectionId].slideTo( initialSlide, 500 );
				}
			}

			if ( el.classList.contains( 'swiper-initialized' ) || ! data ) {
				return;
			}

			let options = btyJsonParse( data.content.textContent );

			// Active slide index.
			options.initialSlide = initialSlide;

			// Autohight on mobile.
			if ( el.parentNode.classList.contains( 'height-mobile-auto' ) && isMobile ) {
				options.autoHeight = true;
			}

			// Init function.
			options.on = {
				init: function ( swp ) {
					let duplicateSlides = swp.el.querySelectorAll( '.swiper-slide.swiper-slide-duplicate' ),
						currentSlide    = swp.wrapperEl.querySelector( '.swiper-slide.swiper-slide-active' );

					// Amination image load.
					if ( duplicateSlides.length ) {
						duplicateSlides.forEach(
							function ( ds ) {
								btyAnimationImageLoad( ds, 0 );
							}
						);
					}

					// Fire on init, once time.
					if ( currentSlide || isMobile ) {
						currentSlide.classList.add( 'swiper-slide-ready' );
					}
				}
			}

			// Init.
			btySliderInstances[sectionId] = new Swiper( el, options );

			// Tabbing issue.
			el.addEventListener(
				'keydown',
				function ( e ) {
					if ( 9 === e.keyCode ) {
						btySliderInstances[sectionId].slideNext();
					}
				}
			);

			// Event.
			btySliderInstances[sectionId].on(
				'transitionStart',
				function ( swp ) {
					let swiperSlide = swp.wrapperEl.querySelectorAll( '.swiper-slide' );

					if ( swiperSlide.length ) {
						swiperSlide.forEach(
							function ( el ) {
								el.classList.remove( 'swiper-slide-ready' );
							}
						);
					}
				}
			);

			btySliderInstances[sectionId].on(
				'transitionEnd',
				function ( swp ) {
					let currentSlide = swp.wrapperEl.querySelector( '.swiper-slide.swiper-slide-active' );

					if ( currentSlide ) {
						currentSlide.classList.add( 'swiper-slide-ready' );
					}
				}
			);

			// Remove template slider options.
			data.remove();

			// Scroll to section.
			let buttons = el.querySelectorAll( '.button.slide-element-inner' );
			if ( buttons.length ) {
				buttons.forEach(
					function ( btn ) {
						let href = btn.getAttribute( 'href' );
						if ( ! href || href.includes( '/' ) ) {
							return;
						}

						let selectorId = document.querySelector( href );

						if ( selectorId ) {
							btn.onclick = function ( e ) {
								e.preventDefault();

								selectorId.scrollIntoView( { behavior: 'smooth' } );
							}
						}
					}
				);
			}
		}
	);
}

// Carousel.
function btyCarousel( doc = document ) {
	let selectors = doc.querySelectorAll( '.carousel-swiper .swiper' );
	if ( ! selectors.length || 'undefined' === typeof( Swiper ) ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let data = el.parentNode.querySelector( '[data-options]' );
			if ( ! data || el.classList.contains( 'swiper-initialized' ) ) {
				return;
			}

			let options = btyJsonParse( data.content.textContent );

			// Custom pagination.
			if ( data.hasAttribute( 'data-custom-pagination' ) && options.pagination ) {
				options.pagination.type = 'custom';

				options.pagination.renderCustom = function ( swiper, current, total ) {
					return current + '/' + total;
				}
			}

			// Use css mode on touch devices.
			if ( ! data.hasAttribute( 'data-css-mode' ) && ( window.matchMedia( '(max-width: 991px)' ).matches || window.matchMedia( '(hover: none)' ).matches ) ) {
				options.cssMode = true;
			}

			// Animation image load.
			options.on = {
				init: function ( swp ) {
					let duplicateSlides = swp.el.querySelectorAll( '.swiper-slide.swiper-slide-duplicate' );
					if ( duplicateSlides.length ) {
						duplicateSlides.forEach(
							function ( ds ) {
								btyAnimationImageLoad( ds, 0 );
							}
						);
					}
				}
			}

			// Init.
			const carousel = new Swiper( el, options );

			// Remove template carousel options.
			data.remove();
		}
	);
}
class collectionList extends HTMLElement {
	connectedCallback() {
		this.addEventListeners();
	}

	addEventListeners() {
		let marqueeItems = this.querySelectorAll( '.marquee-content-item' );

		marqueeItems.forEach( item => {
			item.addEventListener( 'click', () => {
				let bgValue = item.getAttribute( 'data-bg' );
				let section = item.closest( 'collections-list' );

				if ( ! section ) {
					return
				};

				section.querySelectorAll( '.active' ).forEach(el => el.classList.remove( 'active' ));
				section.querySelectorAll( `[data-bg="${bgValue}"]`).forEach(el => el.classList.add( 'active' ) );
			});
		});
	}

	static updateForDesignMode(event) {
		if (Shopify.designMode && event.detail?.blockId) {
			let blockElement = document.querySelector( `[data-block-id="${event.detail.blockId}"]` );

			if ( ! blockElement) {
				return;
			}

			let bgValue = blockElement.getAttribute( 'data-bg' );
			if ( ! bgValue) {
				return;
			}

			let targetItem = document.querySelector( `.marquee-content-item[data-bg="${bgValue}"]` );
			if ( targetItem ) targetItem.click();
		}
	}
}

customElements.define( 'collections-list', collectionList );

document.addEventListener( 'shopify:block:select', event => collectionList.updateForDesignMode(event) );
document.addEventListener( 'shopify:section:select', event => collectionList.updateForDesignMode(event) );

// Header sticky
function btyHeaderSticky() {
	let header = document.querySelector('.header.is-sticky');
	if ( !header ) {
		return;
	}

	let top = window.pageYOffset || document.documentElement.scrollTop;
	let height = header.offsetHeight;
	let headerContainer = document.querySelector('.header.layout-2');

	if (top > height) {
		header.classList.add('solid-sticky');
		headerContainer?.classList.remove('container');
	} else {
		header.classList.remove('solid-sticky');
		headerContainer?.classList.add('container');
	}
}

// Navigation desktop menu.
function btyNavDesktopMenu( doc = document, event = false ) {
	let toggle = doc.querySelector( '.desktop-nav .desktop-toggle-button' ),
		panel  = doc.querySelector( '.site-panel-desktop' );

	if ( ! toggle || ! panel ) {
		return;
	}

	// Close site panel when settings update.
	if ( event && event.detail.load ) {
		btyClosePopup( 'desktop-site-panel-open', panel );
	}

	// Toggle site panel.
	toggle.onclick = function() {
		document.documentElement.classList.add( 'desktop-site-panel-open' );
		btyClosePopup( 'desktop-site-panel-open', panel );
	}

	toggle.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			document.documentElement.classList.add( 'desktop-site-panel-open' );
			btyClosePopup( 'desktop-site-panel-open', panel );
		}
	});

	// Toggle sub menu.
	let links = doc.querySelectorAll( '.site-panel-desktop .has-children' );
	if ( ! links.length ) {
		return;
	}

	links.forEach(
		function( el ) {
			el.onclick = function( e ) {
				if ( e.target.classList.contains( 'menu-text' ) ) {
					return;
				}

				e.preventDefault();

				let menu    = el.closest( '.desktop-toggle-navigation' ),
					parent  = el.parentNode,
					subMenu = parent.querySelector( '.sub-menu' ) || parent.querySelector( '.sub-mega-menu' );
				if ( ! subMenu ) {
					return;
				}

				parent.classList.add( 'active' );

				// Update current sub menu.
				let level = Number( subMenu.getAttribute( 'data-level' ) || 1 ),
					back  = parent.querySelector( '.back' );
				if ( level ) {
					menu.setAttribute( 'data-level', level );
				}

				// Go back parent level.
				if ( back ) {
					back.onclick = function() {
						parent.classList.remove( 'active' );
						menu.setAttribute( 'data-level', level - 1 );
					}
				}
			}
		}
	);
}
/**
 * Predictive Search
 *
 * @package Dev
 */

class PredictiveSearch extends HTMLElement {
	constructor() {
		super();

		this.input                   = this.querySelector( '.quick-search input[type="search"]' );
		this.predictiveSearchResults = this.querySelector( '#predictive-search' );
		this.modalSearch             = this.querySelector( '.search-modal' );
		this.searchButton            = this.querySelector( '.search-form-header .search-button' );

		this.input.addEventListener(
			'input',
			this.debounce(
				(event) => {
					this.onChange( event );
				},
				300
			).bind( this )
		);

		this.input.addEventListener(
			'focus',
			(event) => {
				this.onFocus( event );
			}
		);

		this.input.addEventListener(
			'keydown',
			(event) => {
				this.onKeyDown( event );
			}
		);

		document.addEventListener(
			'click',
			(event) => {
				if ( ! this.contains( event.target ) && ! event.target.classList.contains('action-search') ) {
					this.removeAttribute( 'open' );
				}
			}
		);
	}

	getQuery() {
		return this.input.value.trim();
	}

	onFocus() {
		this.setAttribute( 'open', true );
	}

	onChange() {
		const searchTerm = this.getQuery();

		if ( ! searchTerm.length ) {
			this.close();
			return;
		}

		this.getSearchResults( searchTerm );
	}

	onKeyDown() {
		const searchButton = this.searchButton;
		searchButton.classList.add( 'loading' );

		setTimeout(
			function () {
				searchButton.classList.remove( 'loading' );
			},
			1000
		);
	}

	getSearchResults(searchTerm) {
		fetch(`/search/suggest?q=${searchTerm}&section_id=predictive-search`)
		.then(
			(response) => {
				if ( ! response.ok ) {
					var error = new Error( response.status );
					this.close();
					throw error;
				}

				return response.text();
			}
		)
		.then(
			(text) => {
				const resultsMarkup = new DOMParser().parseFromString( text, 'text/html' ).querySelector( '#shopify-section-predictive-search' ).innerHTML;

				this.predictiveSearchResults.innerHTML = resultsMarkup;
				this.open();
			}
		)
		.catch(
			(error) => {
				this.close();
				throw error;
			}
		);
	}

	open() {
		this.setAttribute( 'results', true );
	}

	close() {
		this.removeAttribute( 'results' );
	}

	debounce(fn, wait) {
		let t;
		return (...args) => {
			clearTimeout( t );
			t = setTimeout( () => fn.apply( this, args ), wait );
		};
	}
}
customElements.define( 'predictive-search', PredictiveSearch );

class ScrollingHandler extends HTMLElement {
	constructor() {
		super();

		this.width     = 0;
		this.scrolling = this.querySelector( '.scrolling-inner' );

		window.addEventListener( 'DOMContentLoaded', this.handler.bind( this ) );
		window.addEventListener( 'resize', this.handler.bind( this ) );

		document.addEventListener( 'shopify:section:load', this.handler.bind( this ) );
		document.addEventListener( 'shopify:section:select', this.handler.bind( this ) );
		document.addEventListener( 'shopify:block:select', this.handler.bind( this ) );
		document.addEventListener( 'product-card-updated', this.handler.bind( this ) );
	}

	handler() {
		if ( this.width == window.innerWidth ) {
			return;
		}

		this.width = window.innerWidth;
		this.scrolling.classList.remove( 'scrolling-animation' );
		let boxes = this.querySelectorAll( '.scrolling-dup' );
		if ( boxes.length ) {
			boxes.forEach(e => e.remove());
		}

		let localWidth = this.closest( '.scrolling-wrapper' ).offsetWidth,
			length     = localWidth / this.scrolling.offsetWidth,
			dup        = false;

		length = length == Infinity?5 : length;

		for ( let i = 0; i < length; i++ ) {
			dup = this.scrolling.cloneNode( true );
			dup.classList.add( 'scrolling-dup', 'scrolling-animation' );
			this.prepend( dup );
		}

		this.scrolling.classList.add( 'scrolling-animation' );
	}
}
customElements.define( 'scrolling-item', ScrollingHandler );
function btySetupHoverEffectImgtext(doc = document) {
	const marqueeItems = doc.querySelectorAll( '.image-with-text-hover .marquee-content-item' );

	// Add class 'active' to the first marquee-content-item.
	if (marqueeItems.length > 0) {
		marqueeItems[0].classList.add('active');
	}

	marqueeItems.forEach(backgroundItem => {
		backgroundItem.addEventListener( 'mouseenter', function () {
			// Remove 'active' class from the previously active item.
			doc.querySelectorAll( '.image-with-text-hover .marquee-content-item.active' ).forEach(activeItem => {
				activeItem.classList.remove( 'active' );
			});

			// Add 'active' class to the hovered item.
			this.classList.add( 'active' );

			const leftBg = this.getAttribute( 'data-bg' );
			const rightElement = doc.querySelector( `.image-with-text-hover .background-item[data-bg="${leftBg.replace('left', 'right')}"]` );

			doc.querySelectorAll( '.image-with-text-hover .background-item.active' ).forEach(activeElement => {
				activeElement.classList.remove( 'active' );
			});

			if (rightElement) {
				rightElement.classList.add( 'active' );
				rightElement.style.transition = 'all 0.5s ease';
			}
		});
	});

	doc.querySelectorAll( '.image-with-text-hover .stretch-section .link-collection' ).forEach(link => {
		link.addEventListener( 'mouseenter' , function () {
			this.closest( '.stretch-section' ).classList.add( 'active-background' );
		});

		link.addEventListener('mouseleave', function () {
			this.closest( '.stretch-section' ).classList.remove( 'active-background' );
		});
	});
}
function btySetupHoverEffect(doc = document) {
	const marqueeItems = doc.querySelectorAll( '.collection-list-hover-image .marquee-content-item' );

	// Add class 'active' to the first marquee-content-item.
	if (marqueeItems.length > 0) {
		marqueeItems[0].classList.add( 'active' );
	}

	marqueeItems.forEach(backgroundItem => {
		backgroundItem.addEventListener('mouseenter', function () {
			// Remove 'active' class from the previously active item.
			doc.querySelectorAll( '.collection-list-hover-image .marquee-content-item.active' ).forEach(activeItem => {
				activeItem.classList.remove( 'active' );
			});

			// Add 'active' class to the hovered item.
			this.classList.add( 'active' );

			const leftBg       = this.getAttribute( 'data-bg' );
			const rightElement = doc.querySelector( `.collection-list-hover-image .background-item[data-bg="${leftBg.replace('left', 'right')}"]` );

			doc.querySelectorAll( '.collection-list-hover-image .background-item.active' ).forEach(activeElement => {
				activeElement.classList.remove( 'active' );
			});

			if (rightElement) {
				rightElement.classList.add( 'active' );
				rightElement.style.transition = 'all 0.5s ease';
			}
		});
	});
}

btySetupHoverEffectImgtext();
btySetupHoverEffect();

// Text hover image.
function btyTextHoverImage( doc = document ) {
	let selectors = doc.querySelectorAll( '.hover-item-text' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let image = el.parentNode.parentNode.querySelector( '.hover-item-image' );
			if ( ! image ) {
				return;
			}

			el.onmousemove = function ( e ) {
				image.style.transform = 'translate3d(' + e.layerX + 'px, ' + e.layerY + 'px, 0px)';
			}
		}
	);
}
function btyImageTab( doc = document ) {
	let selectors = doc.querySelectorAll( '.image-tab-content' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let tabItem = el.querySelectorAll( '.tab-item' );
			if ( ! tabItem.length ) {
				return;
			}

			let sectionId = el.closest( '.shopify-section' ).id.replace( 'shopify-section-', '' );

			tabItem.forEach(
				function ( tab, index ) {
					tab.addEventListener(
						'mousemove',
						function ( e ) {
							if ( btyCarouselInstances[sectionId] ) {
								btyCarouselInstances[sectionId].slideTo( index, 800 );
							}
						}
					);
				}
			);
		}
	);
}
// Lookbook.
function btyLookbook( doc = document ) {
	let selectors = doc.querySelectorAll( '.lookbook' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function ( el ) {
			let target = el.querySelectorAll( '.product-target' );
			if ( ! target.length ) {
				return;
			}

			target.forEach(
				function ( ta ) {
					ta.onclick = function ( e ) {
						e.preventDefault();

						let id   = ta.getAttribute( 'data-product-id' ),
							card = el.querySelector( '.product-card[data-product-id="' + id + '"]' );

						if ( ! card ) {
							return;
						}

						card.scrollIntoView( { behavior: 'smooth' } );
					}
				}
			);

			let swiperContainer = el.querySelector('.swiper');
			if (swiperContainer) {
				let leftItems = el.querySelectorAll('.item-wrapper .item');

				leftItems.forEach(function(item) {
					item.addEventListener('click', function() {
						let index = this.getAttribute('data-index');
						swiperContainer.swiper.slideTo(index);
					});
				});
			}
		}
	);
}

// Marquee.
class MarqueeHandler extends HTMLElement {
	constructor() {
		super();

		this.width   = 0;
		this.marquee = this.querySelector( '.marquee-wrapper' );
		setTimeout( this.resizeHandler.bind( this ), 100 );
		window.addEventListener( 'resize', this.resizeHandler.bind( this ), false );
		this.querySelectorAll( '[loading]' ).forEach(
			( item ) => {
				item.removeAttribute( 'loading' );
			}
		);
	}
	resizeHandler() {
		if (this.width == window.innerWidth) {
			return;
		}

		this.width = window.innerWidth;
		this.marquee.classList.remove( 'marquee-animation' );

		let boxes = this.querySelectorAll( '.marquee-dup' );
		if (boxes.length) {
			boxes.forEach( e => e.remove() );
		}

		let marqueeSection = this.closest( '.marquee-section' );
		if ( ! marqueeSection ) {
			return;
		}

		let local_width = marqueeSection.offsetWidth,
			length      = local_width / this.marquee.offsetWidth,
			dup         = false;

		length = length == Infinity?5 : length;

		for (let i = 0; i < length; i++) {
			dup = this.marquee.cloneNode( true );
			dup.classList.add( 'marquee-dup', 'marquee-animation' );
			this.prepend( dup );
		}

		this.marquee.classList.add( 'marquee-animation' );
	}

}
customElements.define( 'marquee-section', MarqueeHandler );

// Marquee vertical.
class MarqueeHandlerHeight extends HTMLElement {
	constructor() {
		super();

		this.height  = 0;
		this.marquee = this.querySelector( '.two-marquee .marquee-wrapper' );

		setTimeout( this.resizeHandler.bind( this ), 100 );
		window.addEventListener( 'resize', this.resizeHandler.bind( this ), false );

		this.querySelectorAll( '[loading]' ).forEach( ( item ) => {
			item.removeAttribute( 'loading' );
		});
	}

	resizeHandler() {
		if (this.height === window.innerHeight) {
			return;
		}

		this.height = window.innerHeight;
		this.marquee.classList.remove( 'marquee-animation' );

		let boxes = this.querySelectorAll( '.marquee-dup' );
		if (boxes.length) {
			boxes.forEach( ( e ) => e.remove() );
		}

		let marqueeSection = this.closest( '.two-columns' );

		if ( ! marqueeSection ) {
			return;
		}

		let local_height = marqueeSection.offsetHeight,
			length       = local_height / this.marquee.offsetHeight,
			dup          = false;

		length = length === Infinity?5 : Math.ceil( length );

		for (let i = 0; i < length; i++) {
			dup = this.marquee.cloneNode( true );
			dup.classList.add( 'marquee-dup' );
			this.append( dup );
		}

		setTimeout(() => {
			this.querySelectorAll( '.marquee-dup, .marquee-wrapper' ).forEach(( item ) => {
				item.classList.add( 'marquee-animation' );
			});
		}, 50);
	}
}

customElements.define( 'marquee-vertical', MarqueeHandlerHeight );


function btyShoppableVideo( doc = document ) {
	let selectors = doc.querySelectorAll( '.toggle-shoppable-popup' );
	if ( ! selectors.length ) {
		return;
	}

	selectors.forEach(
		function( el ) {
			el.addEventListener(
				'click',
				function( e ) {
					e.preventDefault();

					let section   = el.closest( '.shoppable-video-section' ),
						wrapper   = section?section.querySelector( '.shoppable-popup' ) : false,
						popup     = section?section.querySelector( '.shoppable-popup' ) : false,
						productId = el.getAttribute( 'data-id' ),
						current   = popup?popup.querySelector( '.popup-item[data-id="' + productId + '"]' ) : false;

					if ( ! wrapper || ! current ) {
						return;
					}

					// Show shop now.
					const showNowButton = function( current ) {
						if ( ! current.classList.contains( 'active' ) ) {
							return;
						}

						let btn = current.querySelector( '.product-buy-now-button' )
						if ( ! btn ) {
							return;
						}

						btn.onclick = function( e ) {
							e.preventDefault();

							let item = btn.closest( '.popup-item' );
							if ( ! item ) {
								return;
							}

							item.classList.add( 'shop-now-open' );
						}
					}

					// Set new active.
					let oldCurrent = current.parentNode.querySelector( '.active' );
					if ( oldCurrent ) {
						oldCurrent.classList.remove( 'active' );
					}
					current.classList.add( 'active' );

					// Play video.
					let video = current.querySelector( '.area-video video' );
					if ( video ) {
						video.play();
					}

					showNowButton( current );

					// Close popup.
					document.documentElement.classList.add( 'shoppable-popup-open' );
					btyClosePopup( 'shoppable-popup-open', popup, true );

					document.addEventListener(
						'click',
						function( e ) {
							if ( e.target.classList.contains( 'popup-controls' ) ) {
								document.documentElement.classList.remove( 'shoppable-popup-open' );

								document.dispatchEvent( new CustomEvent( 'theme-popup-close' ) );
							}

							return false;
						}
					);

					// Remove active when close popup.
					document.addEventListener(
						'theme-popup-close',
						function() {
							if ( document.documentElement.classList.contains( 'shoppable-popup-open' ) ) {
								return;
							}

							let currentItem = popup.querySelector( '.popup-item.active' );
							if ( currentItem ) {
								currentItem.classList.remove( 'active', 'shop-now-open' );

								let currentVideo = currentItem.querySelector( '.area-video video' );
								if ( currentVideo ) {
									currentVideo.pause();
								}
							}
						}
					);

					// Next/prev function.
					let arrows = popup.querySelectorAll( '.arrow-button' );
					if ( arrows.length ) {
						arrows.forEach(
							function( ar ) {
								ar.onclick = function() {
									let continueItem,
										currentItem = popup.querySelector( '.popup-item.active' ),
										type        = ar.getAttribute( 'data-type' );

									if ( ! currentItem ) {
										return;
									}

									// Remove item inactive.
									currentItem.classList.remove( 'active', 'shop-now-open' );

									// Pause inactive video.
									let currentVideo = currentItem.querySelector( '.area-video video' );
									if ( currentVideo ) {
										currentVideo.pause();
									}

									// Get prev/next item.
									if ( 'prev' == type ) {
										continueItem = currentItem.previousSibling?currentItem.previousSibling : currentItem.parentNode.lastChild;
									} else {
										continueItem = currentItem.nextSibling?currentItem.nextSibling : currentItem.parentNode.firstChild;
									}

									// Set new active.
									continueItem.classList.add( 'active' );

									// Show shop now.
									showNowButton( continueItem );

									// Play video.
									let continueVideo = continueItem.querySelector( '.area-video video' );
									if ( continueVideo ) {
										continueVideo.play();
									}
								}
							}
						);
					}

					document.addEventListener(
						'product-variant-updated',
						function( e ) {
							let currentPopup = popup.querySelector( '.popup-item.active' ),
								currentMedia = currentPopup?popup.querySelector( '.popup-item.active .product-media' ) : false,
								index        = currentPopup?Array.from( currentPopup.parentNode.children ).indexOf( currentPopup ) : 0,
								sectionId    = el.closest( '.shopify-section' ).id.replace( 'shopify-section-', '' ) + ( index + 1 ),
								initialSlide = e.detail.selected.featured_image?e.detail.selected.featured_image.position - 1 : 0,
								link         = currentPopup?currentPopup.querySelector( '.view-product-detail' ) : false;

							// Update current media.
							if ( 'undefined' !== typeof( btyCarouselInstances[sectionId] ) ) {
								if ( currentMedia ) {
									currentMedia.scrollIntoView( { behavior: 'smooth', block: 'end', inline: 'end' } );
								}

								btyCarouselInstances[sectionId].slideTo( initialSlide, 600 );
							}

							// Update product url.
							if ( link ) {
								link.setAttribute( 'href', link.href.split( '?' )[1]?link.href.split( '?' )[0] + '?variant=' + e.detail.selected.id : link.href + '?variant=' + e.detail.selected.id );
							}
						}
					);
				}
			);
		}
	);
}
function moveSwiperControls() {
	setTimeout(() => {
		let contentDiv  = document.querySelector( '.split-screen-slideshow-section .split-screen-slideshow-content' ),
			sliderDiv   = document.querySelector( '.split-screen-slideshow-section .split-screen-slideshow-slider' ),
			controlsDiv = document.querySelector( '.split-screen-slideshow-section .swiper-controls' );

		if (contentDiv && sliderDiv && controlsDiv) {
			if (window.innerWidth <= 991) {
				if ( contentDiv.contains( controlsDiv ) ) {
					sliderDiv.appendChild( controlsDiv );
				}
			} else {
				if ( sliderDiv.contains( controlsDiv ) ) {
					contentDiv.appendChild( controlsDiv );
				}
			}
		}
	}, 100);
}

window.addEventListener( 'resize', moveSwiperControls );
window.addEventListener( 'load', moveSwiperControls );

function btyMoveAllSwiperControls() {
	const sections = document.querySelectorAll( '.product-slider-section' );

	sections.forEach(section => {
		let swiperControls    = section.querySelector( '.swiper-controls' ),
			productSliderLeft = section.querySelector( '.product-slider-left' ),
			swiper            = section.querySelector( '.swiper' );

		if ( ! swiperControls || !productSliderLeft || !swiper ) return;

		if (window.innerWidth <= 991) {
			if ( ! swiper.contains( swiperControls )) swiper.appendChild( swiperControls );
		} else {
			if ( ! productSliderLeft.contains( swiperControls )) productSliderLeft.appendChild( swiperControls );
		}
	});
}

btyMoveAllSwiperControls();
window.addEventListener( 'resize', btyMoveAllSwiperControls );

// Update Progress Bar Cart.
function btyUpdateProgressBarCart( cartTotal, itemCount  ) {
	const progressWrapper = document.getElementById( 'cart-progress-wrapper' );

	if ( ! progressWrapper ) {
		return;
	}

	const moneyFormat            = progressWrapper.dataset.moneyFormat;
	const preGoalMessageTemplate = progressWrapper.dataset.preGoalMessageTemplate;
	const postGoalMessage        = progressWrapper.dataset.postGoalMessage;

	const progressBar        = document.getElementById( 'cart-progress-bar' );
	const goalMessageElement = document.querySelector( '.goal-message' );

	let progressThreshold = Math.round(progressWrapper.dataset.threshold * (Shopify.currency.rate || 1));

	if ( ! moneyFormat || ! progressThreshold || ! preGoalMessageTemplate || ! postGoalMessage || ! progressBar || ! goalMessageElement ) {
		return;
	}

	if ( itemCount === 0 || cartTotal === 0 ) {
		if ( progressWrapper ) {
			progressWrapper.style.display = 'none';
		}
		if ( goalMessageElement ) {
			goalMessageElement.style.display = 'none';
		}
	} else {
		if ( progressWrapper ) {
			progressWrapper.style.display = 'block';
			progressWrapper.setAttribute( 'data-threshold-selected-currency', progressThreshold );
		}

		if ( progressBar ) {
			progressBar.style.display = 'block';

			let progressPercentage = null;

			// console.log( cartTotal );

			if ( cartTotal ) {
				progressPercentage = Math.min( ( cartTotal / progressThreshold ) * 100, 100 );
			} else {
				let sideCartPrice = document.querySelector( '.side-cart-footer .total-price' );
				if ( sideCartPrice ) {
					let total_price_str    = sideCartPrice.textContent.replace( /\D/g,'' ),
						total_price_number = Number( total_price_str );

					if ( moneyFormat.includes( '{{amount_no_decimals}}' ) || moneyFormat.includes( '{{amount_no_decimals_with_comma_separator}}' ) || moneyFormat.includes( '{{amount_no_decimals_with_space_separator}}' ) ) {
						progressPercentage = Math.min( ( total_price_number * 100 / progressThreshold ) * 100, 100 );
					} else {
						progressPercentage = Math.min( ( total_price_number / progressThreshold ) * 100, 100 );
					}
				}

				let mainCartPrice = document.querySelector( '.cart-page-section .cart-totals .totals-price' );
				if ( mainCartPrice ) {
					let total_price_str    = mainCartPrice.textContent.replace( /\D/g,'' ),
						total_price_number = Number( total_price_str );

					if ( moneyFormat.includes( '{{amount_no_decimals}}' ) || moneyFormat.includes( '{{amount_no_decimals_with_comma_separator}}' ) || moneyFormat.includes( '{{amount_no_decimals_with_space_separator}}' ) ) {
						progressPercentage = Math.min( ( total_price_number * 100 / progressThreshold ) * 100, 100 );
					} else {
						progressPercentage = Math.min( ( total_price_number / progressThreshold ) * 100, 100 );
					}
				}
			}

			progressBar.style.width = `${progressPercentage}%`;

			if ( progressPercentage >= 100 ) {
				progressWrapper.classList.add( 'full' );
			} else {
				progressWrapper.classList.remove( 'full' );
			}
		}

		if ( goalMessageElement ) {
			goalMessageElement.style.display = 'block';

			let remainingForGoal = null;

			if ( cartTotal ) {
				remainingForGoal = progressThreshold - cartTotal;
			} else {
				let sideCartPrice = document.querySelector( '.side-cart-footer .total-price' );
				if ( sideCartPrice ) {
					let total_price_str    = sideCartPrice.textContent.replace( /\D/g,'' ),
						total_price_number = Number( total_price_str );

					if ( moneyFormat.includes( '{{amount_no_decimals}}' ) || moneyFormat.includes( '{{amount_no_decimals_with_comma_separator}}' ) || moneyFormat.includes( '{{amount_no_decimals_with_space_separator}}' ) ) {
						remainingForGoal = progressThreshold - Math.min( total_price_number * 100 );
					} else {
						remainingForGoal = progressThreshold - total_price_number;
					}
				}

				let mainCartPrice = document.querySelector( '.cart-page-section .cart-totals .totals-price' );
				if ( mainCartPrice ) {
					let total_price_str    = mainCartPrice.textContent.replace( /\D/g,'' ),
						total_price_number = Number( total_price_str );

					if ( moneyFormat.includes( '{{amount_no_decimals}}' ) || moneyFormat.includes( '{{amount_no_decimals_with_comma_separator}}' ) || moneyFormat.includes( '{{amount_no_decimals_with_space_separator}}' ) ) {
						remainingForGoal = progressThreshold - Math.min( total_price_number * 100 );
					} else {
						remainingForGoal = progressThreshold - total_price_number;
					}
				}
			}

			if ( remainingForGoal < 0 ) {
				remainingForGoal = 0;
			}

			let remainingAmount = remainingForGoal;

			let remainingAmountFormatted = btyFormatPrice(remainingAmount);

			const preGoalMessage = preGoalMessageTemplate.replace( '[amount]', remainingAmountFormatted );

			goalMessageElement.innerHTML = remainingForGoal > 0 ? preGoalMessage : postGoalMessage;
		}
	}
}

// Minicart recommendations.
function btyMinicartRecommendations( doc = document ) {
	let selector = doc.querySelector( '.minicart-recommendations[data-source]' );
	if ( ! selector ) {
		return;
	}

	let url = selector.getAttribute( 'data-url' );

	if ( selector.innerHTML.trim() || ! url ) {
		return;
	}

	fetch( url )
		.then(
			function( r ) {
				if ( 200 !== r.status ) {
					console.log( 'Status Code: ' + r.status );
					throw r;
				}

				return r.text();
			}
		).then(
			function( res ) {
				selector.innerHTML = btyGetSectionHtml( res, '.minicart-recommendations[data-source]' );

				btyAddToCart( selector );
				btyQuickView( selector );
				btySwatch( selector );
				btyAnimationImageLoad( selector );
				btyHoverMediaVideo( selector );
				btyQuickAdd( selector );
				btyCarousel( selector );
				btyScrollAnimationTrigger( selector );

				// Fire when product card updated.
				document.dispatchEvent( new CustomEvent( 'product-card-updated' ) );
			}
		).catch(
			function( err ) {
				console.log( err );
			}
		);
}

// Side cart click outer popup.
function btySideCartPopupOuter( doc = document ) {
	let selector = doc.querySelector( '.side-cart-inner' ),
		overlay  = selector?selector.querySelector( '.mini-cart-overlay' ) : false,
		popup    = selector?selector.querySelectorAll( '.popup-toolDown' ) : false;

	if ( ! popup.length || ! overlay) {
		return;
	}

	popup.forEach(
		function( el ) {
			selector.addEventListener(
				'mousedown',
				function( e ) {
					if ( ! el.contains( e.target ) ) {
						if ( el.classList.contains( 'open' ) && overlay.classList.contains( 'open' ) ) {
							el.classList.remove( "open" );
							overlay.classList.remove( "open" );
						}
					}
				}
			);
		}
	);
}
/**
 * Cart Side
 *
 * @package Dev
 */

class CartTool extends HTMLElement{
	constructor(){
		super(),
		this.querySelectorAll( ".cartTool-item" ).forEach(
			button => {
				button.addEventListener(
					"click",
					event => {
						const id = event.target.dataset.popup;
						document.getElementById( id ).classList.add( "open" ),
						document.querySelector( ".mini-cart-overlay" ).classList.add( "open" )
					}
				)
			}
		)
	}
}

customElements.define( "cart-item-tool", CartTool );

class CartCancel extends HTMLElement{
	constructor(){
		super(),
		this.querySelector( "button" ).addEventListener(
			"click",
			event => {
				document.querySelector( ".popup-toolDown.open" ).classList.remove( "open" ),
				document.querySelector( ".mini-cart-overlay" ).classList.remove( "open" )
			}
		)
	}
}

customElements.define( "cart-cancel-popup", CartCancel );

class CartNote extends HTMLElement{
	constructor(){
		super(),
		this.querySelector( "[data-update-note]" ).addEventListener(
			"click",
			event => {
				this.val   = this.querySelector( ".text-area" ).value;
				const body = JSON.stringify( { note:this.val } );

				fetch(
					btyGlobals.cart_update_url,
					{...btyFetchConfig(), ...{ body } }
				).then(
					function( r ) {
						return r.json();
					}
				).catch(
					function( e ) {
						console.error( e );
					}
				).finally(
					function() {
						document.querySelector( ".mini-cart-body.open" ).classList.remove( "open" ),
						document.querySelector( ".mini-cart-overlay.open" ).classList.remove( "open" )
					}
				);
			}
		)
	}
}

customElements.define( "cart-note", CartNote );
// DOM Loaded.
document.addEventListener(
	'DOMContentLoaded',
	function () {
		if ( ! Shopify.designMode && window.location === window.parent.location ) {
			document.body.classList.add( 'has-header-bar' );
		}

		btyLookbook();
		btyAccordionHover();
		btyScrollBar();
		btyRecipientForm();
		btyNewsletterPopup();
		btyAgeverificationPopup();
		btyToggleDetails();
		btyQuickAdd();
		btyHoverMediaVideo();
		btyCollectionSticky();
		btyAnimationImageLoad();
		btyAnimationCollageLoad();
		btyAccountPopup();
		btyCarousel();
		btySplitSlider();
		btyProductTabs();
		btyCountdownTime();
		btyNavMenu();
		btyNavDesktopMenu();
		btyCookiesBar();
		btySlider();
		btyQuantityButton();
		btySideCart();
		btyQuickSearch();
		btyAddToCart();
		btyAddMultiProductToCart();
		btyUpdateProductQuantity();
		btyQuickView();
		btySwatch();
		btyAccordionHandle();
		btyToggleDropdown();
		btyVideo();
		btyMoveAllSwiperControls();
		btyBackgroundVideo();
		btyAddress();
		btyPickupAvailabilityInit();
		btyProductVariants();
		btyProductPopup();
		btyProductShare();
		btyImageTab();
		btyScrollAnimationTrigger();
		btyHeaderSticky();
		btyShoppableVideo();
		btySetupHoverEffect();
		btySetupHoverEffectImgtext();
		btyMediaDesktop();
		btyTextHoverImage();
		btyMinicartRecommendations();
		btySideCartPopupOuter();
		btyFooterAccordion();
		btyUpdateProgressBarCart();

		window.addEventListener(
			'resize',
			function () {
				btyFooterAccordion();
				btySplitSlider();
				btyMediaDesktop();
				btyMoveAllSwiperControls();
			}
		);

		window.addEventListener(
			'scroll',
			function () {
				btyHeaderSticky();
				btyScrollingDetect();
				btyAnimationImageLoad();
				btyAnimationCollageLoad();
			}
		);
	}
);

// Design mode event.
document.addEventListener(
	'shopify:section:load',
	function ( e ) {
		let section = e.target;

		btyTextHoverImage( section );
		btySplitSlider( section );
		btyAccordionHover( section );
		btyAnimationImageLoad( section );
		btyAnimationCollageLoad( section );
		btyCountdownTime( section );
		btyCarousel( section );
		btyProductTabs( section );
		btyAccordionHandle( section );
		btyToggleDropdown( section );
		btySlider( section );
		btyVideo( section );
		btyMoveAllSwiperControls( section );
		btyBackgroundVideo( section );
		btyAddress( section );
		btyProductVariants( section );
		btyProductPopup( section );
		btyProductShare( section );
		btyGoogleMap( section );
		btyCollectionSticky( section );
		btyQuantityButton( section );
		btyImageTab( section );
		btySetupHoverEffect( section );
		btySetupHoverEffectImgtext( section );
		btyScrollAnimationTrigger( section, true );
		btyMinicartRecommendations( section );
		btySideCartPopupOuter( section );
		btyUpdateProgressBarCart( section );
		console.log( 'Section load.' );
	}
);
document.addEventListener(
	'shopify:section:select',
	function ( e ) {
		let section = e.target;

		btyTextHoverImage( section );
		btySplitSlider( section );
		btyAccordionHover( section );
		btyQuickSearch();
		btyCookiesBar( section );
		btyNewsletterPopup( section );
		btyAgeverificationPopup( section );
		btyAnimationImageLoad( section );
		btyAnimationCollageLoad( section );
		btyNavMenu( section, e );
		btyNavDesktopMenu( section, e );
		btyToggleDropdown( section );
		btyCarousel( section );
		btyProductTabs( section );
		btyCountdownTime( section );
		btyAccordionHandle( section );
		btyVideo( section );
		btyMoveAllSwiperControls( section );
		btyBackgroundVideo( section );
		btyAddress( section );
		btyProductVariants( section );
		btyProductPopup( section );
		btyProductShare( section );
		btyAccountPopup( section );
		btyQuickAdd( section );
		btyScrollBar( section );
		btyHoverMediaVideo( section );
		btySwatch( section );
		btyCollectionSticky( section );
		btyAddToCart( section );
		btyAddMultiProductToCart( section );
		btyQuantityButton( section );
		btyImageTab( section );
		btyShoppableVideo( section );
		btySetupHoverEffect( section );
		btySetupHoverEffectImgtext( section );
		btyMinicartRecommendations( section );
		btySideCartPopupOuter( section );
		btyLookbook( section );
		btyUpdateProgressBarCart( section );

		console.log( 'Section select.' );
	}
);
document.addEventListener(
	'shopify:block:select',
	function ( e ) {
		console.log( 'Block select.' );

		let section = document.getElementById( 'shopify-section-' + e.detail.sectionId );
		if ( ! section ) {
			return;
		}

		btySplitSlider( section );
		btyAccordionHover( section );
		btyNewsletterPopup( section );
		btyAgeverificationPopup( section );
		btyAnimationImageLoad( section );
		btyAnimationCollageLoad( section );
		btyProductTabs( section, e );
		btySlider( section, e );
		btyCarousel( section, e );
		btyCollectionSticky( section );
		btyImageTab( section );
		btyShoppableVideo( section );
		btySetupHoverEffect( section );
		btySetupHoverEffectImgtext( section );
		btyMinicartRecommendations( section );
		btySideCartPopupOuter();
		btyMoveAllSwiperControls( section );
		btyLookbook( section );
		btyUpdateProgressBarCart( section );
	}
);
document.addEventListener(
	'shopify:section:reorder',
	function ( e ) {
		let section = e.target;

		btyScrollAnimationTrigger( section, true );

		console.log( 'Section reorder.' );
	}
);






// Filter Js - By Amaan Mirza ========================

// ✅ COMPLETE AJAX FILTER - Perfect Working
(function() {
  
  // ✅ 1. Page load hone par setup karo
  document.addEventListener('DOMContentLoaded', function() {
    setupBadgeListeners();
  });

  // ✅ 2. Checkbox change par filter
  document.addEventListener('change', function (e) {
    if (e.target.matches('.filter-form input[type="checkbox"]')) {
      applyFilters(e.target.closest('form'));
    }
  });

  // ✅ 3. Reset button (sidebar me)
  document.addEventListener('click', function (e) {
    if (e.target.matches('.item-reset')) {
      e.preventDefault();
      const form = document.querySelector('.filter-form');
      if (form) {
        form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => cb.checked = false);
        applyFilters(form);
      }
    }
  });

  // ✅ 4. Badge listeners setup
  function setupBadgeListeners() {
    // Clear all button
    document.addEventListener('click', function(e) {
      if (e.target.textContent && e.target.textContent.trim() === 'Clear all') {
        e.preventDefault();
        const form = document.querySelector('.filter-form');
        if (form) {
          form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            cb.checked = false;
          });
          applyFilters(form);
        }
      }
    });

    // Individual badge × buttons (event delegation)
    document.addEventListener('click', function(e) {
      // Check if clicked element is inside a badge with × or close button
      const badge = e.target.closest('a[href*="filter"]');
      
      if (badge && badge.textContent.includes('×')) {
        e.preventDefault();
        e.stopPropagation();
        
        // Badge se filter value extract karo
        const badgeText = badge.textContent.replace('×', '').trim().toLowerCase();
        
        // Form me us checkbox ko find karke uncheck karo
        const form = document.querySelector('.filter-form');
        if (form) {
          const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
          
          checkboxes.forEach(checkbox => {
            const label = checkbox.closest('label');
            if (label) {
              const labelText = label.textContent.toLowerCase();
              
              // Agar badge text label me hai to uncheck karo
              if (labelText.includes(badgeText) || badgeText.includes(labelText.split('(')[0].trim().toLowerCase())) {
                checkbox.checked = false;
              }
            }
          });
          
          // Filter apply karo
          applyFilters(form);
        }
      }
    });
  }

  // ✅ 5. Main AJAX Function
  function applyFilters(form) {
    if (!form) return;

    // Saare checked filters collect karo
    const params = new URLSearchParams();
    const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
      params.append(checkbox.name, checkbox.value);
    });

    // URL banao
    const url = window.location.pathname + (params.toString() ? '?' + params.toString() : '');

    // AJAX call
    fetch(url)
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');
        
        // ✅ Products update
        const productGrid = document.querySelector('.products');
        const newProducts = newDoc.querySelector('.products');
        
        if (productGrid && newProducts) {
          productGrid.innerHTML = newProducts.innerHTML;
        }

        // ✅ Active badges container ko PURA replace karo
        const currentBadgeContainer = document.querySelector('.collection-filters, [class*="active"], .filter-badges');
        const newBadgeContainer = newDoc.querySelector('.collection-filters, [class*="active"], .filter-badges');
        
        if (currentBadgeContainer && newBadgeContainer) {
          // Badges wala section find karo jisme "Pink ×", "Clear all" hai
          const findBadgeParent = (elem) => {
            if (elem.textContent.includes('Clear all') || elem.textContent.includes('×')) {
              return elem;
            }
            return elem.querySelector('[class*="filter"], [class*="facet"], [class*="badge"]');
          };
          
          const oldBadges = findBadgeParent(currentBadgeContainer);
          const newBadges = findBadgeParent(newBadgeContainer);
          
          if (oldBadges && newBadges) {
            oldBadges.innerHTML = newBadges.innerHTML;
          }
        }

        // ✅ Selected count update
        const currentCount = form.querySelector('.item-selected');
        const newCount = newDoc.querySelector('.item-selected');
        
        if (currentCount && newCount) {
          currentCount.textContent = newCount.textContent;
        }

        // ✅ Product count update ("Showing X products")
        const productCountSelectors = ['.collection-product-count', '.product-count', 'h2'];
        
        for (let selector of productCountSelectors) {
          const current = document.querySelector(selector);
          const newElem = newDoc.querySelector(selector);
          
          if (current && newElem && newElem.textContent.includes('product')) {
            current.textContent = newElem.textContent;
            break;
          }
        }
        
        // ✅ URL update
        history.pushState({}, '', url);
        
        // ✅ Badge listeners ko re-setup karo (AJAX ke baad)
        setTimeout(() => setupBadgeListeners(), 100);
      })
      .catch(error => {
        console.error('Filter error:', error);
      });
  }

})();