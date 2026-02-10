/**
 * Cart Side
 *
 * @package Dev
 */

'use strict';

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