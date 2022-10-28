let g_sol = ( function () {
	"use strict";

	let m_baseSpeed = 150;
	let m_slowSpeed = 500;
	let m_speedPerPixel = 0.5;
	let m_isShrunk = false;
	let m_resizeTimeout = null;
	let m_isRunning = false;

	return {
		"start": start
	};
	
	function start() {
		m_isRunning = true;
		g_uiDrag.setupDragCards(
			".normal-stack .card-flipped, #main-pile .card-flipped:nth-last-child(1)" +
				", .stack .card-flipped:nth-last-child(1)",
			"stack",
			m_speedPerPixel,
			canPlaceCard,
			checkSize
		);
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
		$( "#table" ).on( "click", ".stack", stackClicked );
		$( document.body ).on( "dblclick",
			".normal-stack .card-flipped:nth-last-child(1), #main-pile .card-flipped:nth-last-child(1)",
			cardDoubleClick
		);
		$( window ).on( "resize", onWindowResize );
	}
	/*
 		Event Functions
 	*/

	function stackClicked() {
		var $card, $stack;

		if( !m_isRunning ) {
			return;
		}

		$stack = $( this );
		$card = $stack.children().last();
		if ( $card.length > 0 && $card.hasClass( "card" ) && !$card.hasClass( "card-flipped" ) ) {
			g_ui.flipCard( $stack );
		}
	}

	function cardDoubleClick() {
		var $card, $stacks, i, $stack;

		$card = $( this );
		$stacks = $( ".suit-stack" );
		for( i = 0; i < $stacks.length; i++ ) {
			$stack = $( $stacks.get( i ) );
			if( canPlaceCard( $stack, $card ) ) {
				g_ui.dealCard( $card.parent(), $stack );
				g_ui.onComplete( function () {
					checkSize();
				} );
				break;
			}
		}
		g_uiDrag.resetDrag();
	}

	function onWindowResize() {
		// TODO: Add a loading screen when resizing cards
		clearTimeout( m_resizeTimeout );
		m_resizeTimeout = setTimeout( resize, 100 );
	}

	/*
 		Internal Functions
 	*/

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

	function checkSize() {
		var height, $cards, maxCard, maxBottom, rect, bottom;

		$( ".card-flipped:not(#stacks .card-flipped)" ).css( "height", "" );

		maxBottom = 0;
		height = $( "#table" ).height();
		$cards = $( "#stacks .stack .card-flipped" );
		$cards.each( function () {
			rect = this.getBoundingClientRect();
			bottom = rect.bottom + rect.height;
			if( bottom > maxBottom ) {
				maxBottom = bottom;
				maxCard = this;
			}
		} );

		if( maxBottom > height ) {
			resizeStacks( height, maxCard );
		} else if( m_isShrunk ) {
			$( "#stacks .stack .card" ).css( "height", "" );
			m_isShrunk = false;
			checkSize();
		}
	}

	function resizeStacks( height, card ) {
		var rect, diff, $allCards, baseHeight, sizeMult;

		m_isShrunk = true;
		$( "#stacks .stack .card:not(.card-flipped)" ).css( "height", "2px" );
		$allCards = $( "#stacks .stack .card-flipped" );
		baseHeight = $allCards.last().height();

		for( sizeMult = 0.95; sizeMult > 0.6;  sizeMult -= 0.05 ) {
			rect = card.getBoundingClientRect();
			diff = height - rect.bottom;
			if( diff < baseHeight ) {
				$allCards.css( "height", baseHeight * sizeMult + "px" );
			} else {
				break;
			}
		}
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

	function canPlaceCard( $stack, $card ) {
		var valueCard, $stackCard, valueStack, cardNumber, stackNumber, isSuitStack;

		// Is this one card or a stack of cards
		if( $card.get( 0 ).id === "selected-cards" ) {
			$card = $card.children().first();
		}

		isSuitStack = $stack.hasClass( "suit-stack" );

		valueCard = parseInt( $card.get( 0 ).dataset.card );
		cardNumber = g_cards.getNumber( valueCard );
		$stackCard = $stack.children().last();
		if( $stackCard.length === 0 ) {
			return ( cardNumber === 13 && !isSuitStack ) || ( cardNumber === 1 && isSuitStack );
		}

		valueStack = parseInt( $stackCard.get( 0 ).dataset.card );
		stackNumber = g_cards.getNumber( valueStack );

		if( isSuitStack ) {
			return g_cards.getSuit( valueCard ) === g_cards.getSuit( valueStack ) &&
				cardNumber === stackNumber + 1;
		}

		if( g_cards.getColor( valueCard ) === g_cards.getColor( valueStack ) ) {
			return false;
		}

		if( cardNumber === stackNumber - 1 ) {
			return true;
		}
		return false;
	}

} )();
