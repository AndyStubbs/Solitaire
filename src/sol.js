let g_sol = ( function () {
	"use strict";

	return {
		"start": start
	};
	
	function start() {
		g_ui.createDeck( g_cards.createDeck( true ), $( "#main-deck" ) );
		dealDeck();
		g_ui.resize();
	}

	function dealDeck() {
		for( let row = 0; row < 7; row += 1 ) {
			for( let col = row; col < 7; col += 1 ) {
				g_ui.dealCard( $( "#main-deck" ), $( "#stack-" + ( col + 1 ) ) );
			}
		}
		g_ui.onComplete(function () {
			for( let i = 1; i < 8; i++ ) {
				g_ui.flipCard( $( "#stack-" + i ) );
			}
		});
	}

} )();
