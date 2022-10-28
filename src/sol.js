let g_sol = ( function () {
	"use strict";

	let m_baseSpeed = 150;
	let m_slowSpeed = 500;
	
	return {
		"start": start
	};
	
	function start() {
		g_uiDrag.setupDragCards( ".stack .card-flipped, #main-pile .card-flipped:nth-last-child(1)" );
		g_ui.createDeck( g_cards.createDeck( true ), $( "#main-deck" ) );
		g_ui.setSpeed( m_baseSpeed );
		dealDeck();
		resize();
		g_ui.setupDeckClick( $( "#main-deck" ), $( "#main-pile" ), function () {
			g_ui.setSpeed( m_slowSpeed );
			$( "#main-pile .card" ).each(function () {
				g_ui.dealCard( $( "#main-pile" ), $( "#main-deck" ), true, true );
			} );
			setTimeout( function () {
				g_ui.setSpeed( m_baseSpeed );
			}, m_slowSpeed );
		} );
	}

	function resize() {
		var $table, i, size, left, style, cardWidth, cardHeight, cardPadding, names, width, height;

		$table = $("#table");

		// Get Width and height
		width = $table.width();
		height = $table.height();

		// Compute Pile Margins
		size = 0.25;
		left = 0;
		style = "";
		for (i = 2; i < 53; i++) {
			left += size;
			style += ".pile .card:nth-child(" + i + "){margin-left:" + left + "px;} ";
		}

		// Compute background positions
		cardWidth = 142;
		cardHeight = 215;
		cardPadding = 1;

		if (width < 780 || height < 480) {
			cardWidth *= 0.5;
			cardHeight *= 0.5;
			cardPadding *= 0.5;
		} else if (width < 1160 || height < 680) {
			cardWidth *= 0.75;
			cardHeight *= 0.75;
			cardPadding *= 0.75;
		}

		// Compute Card Background Positions Y
		names = ["card-spades", "card-hearts", "card-diamonds", "card-clubs"];
		size = -cardPadding;
		for (i = 0; i < names.length; i++) {
			style += "." + names[i] + "{background-position-y: " + size + "px; }";
			size += -(cardPadding + cardHeight);
		}

		// Compute Card Background Position X
		names = [
			"card-a", "card-2", "card-3", "card-4", "card-5", "card-6", "card-7",
			"card-8", "card-9", "card-10", "card-j", "card-q", "card-k"
		];
		size = -cardPadding;
		for (i = 0; i < names.length; i++) {
			style += "." + names[i] + "{background-position-x: " + size + "px; }"
			size += -(cardPadding + cardWidth);
		}

		// Add to custom styles
		$("#custom-styles").html(style);

		g_menu.resize(height);
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
