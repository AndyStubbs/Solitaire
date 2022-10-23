let g_sol = ( function () {
	"use strict";

	let m_board = {
		"deck": cards.createDeck(),
		"field": [[],[],[],[],[],[],[]],
		"final": [[],[],[],[]]
	};
	let m_settings = {
		"deal_speed": 500,
		"flip_speed": 250
	};

	return {
		"start": start
	};
	
	function start() {
		createBoard();
		initialDeal();
	}
	
	function createBoard() {
		m_board = {
			"deck": cards.createDeck(),
			"field": [[],[],[],[],[],[],[]],
			"final": [[],[],[],[]]
		};
	}
	
	function initialDeal() {
		for( let col = 0; col < 7; col += 1 ) {
			for( let field = col; field < 7; field += 1 ) {
				let card = g_cards.dealCard( m_board.deck )[ 0 ];				
				m_board.field[ field ].push( card );
			}
		}
	}
} )();

sol.start();