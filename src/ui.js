let g_ui = (function() {
	"use strict";

	let m_speed = 150;
	let m_animations = 0;
	let m_delay = 75;
	let m_onCompleteCommands = [];
	let m_deckClickedParams;
	let m_timeouts = [];

	return {
		"createDeck": createDeck,
		"createCard": createCard,
		"dealCard": dealCard,
		"flipCard": flipCard,
		"onComplete": onComplete,
		"setupDeckClick": setupDeckClick,
		"disableDeckClick": disableDeckClick,
		"setSpeed": setSpeed,
		"reset": reset
	};

	function createDeck( deck, $dest ) {
		for( let i = 0; i < deck.length; i++ ) {
			let $card = createCard( deck[ i ]);
			$dest.append( $card );
		}
	}

	function createCard( value )  {
		var $card, cardValue, cardSuit;

		cardSuit = g_cards.getSuit( value );
		cardValue = g_cards.getValueClass( value );
		$card = $(
			"<div class='card' data-card='" + value + "'>" +
			"<div class='card-part card-back'></div>" +
			"<div class='card-part card-front " + cardSuit + " " + cardValue + "'></div>" +
			"</div>"
		);

		$card.find( ".card-part" ).css( "transition-duration", ( m_speed / 1000 ) + "s" );
		
		return $card;
	}

	function dealCard( $src, $dest, isFlip, noDelay ) {
		runDealCardAnimation( $src, $dest, isFlip, noDelay );
		if( !noDelay ) {
			m_animations += 1;	
		}
	}

	function flipCard( $src ) {
		runFlipCardAnimation( $src );
		m_animations += 1;
	}

	function onComplete( cmd ) {
		m_onCompleteCommands.push( cmd );
	}

	function setupDeckClick( $src, $dest, dealCount, onCardDealt, onEmptyCmd ) {
		m_deckClickedParams = [ $src, $dest, dealCount, onCardDealt, onEmptyCmd ];
		$src.on( "click", deckClicked );
	}

	function disableDeckClick( $src ) {
		$src.off( "click", deckClicked );
	}

	function setSpeed( speed ) {
		m_speed = speed;
		m_delay = m_speed / 2;
		$( ".card-part" ).css( "transition-duration", ( m_speed / 1000 ) + "s" );
	}

	function reset( $src ) {
		m_onCompleteCommands = [];
		m_animations = 0;
		$src.off( "click", deckClicked );
		m_timeouts.forEach( function ( timeout ) {
			clearTimeout( timeout );
		} );
	}

	/*
 		Internal Functions
 	*/

	function deckClicked() {
		let $src, $dest, dealCount, onCardDealt, onEmptyCmd;
		$src = m_deckClickedParams[ 0 ];
		$dest = m_deckClickedParams[ 1 ];
		dealCount = m_deckClickedParams[ 2 ];
		onCardDealt = m_deckClickedParams[ 3 ];
		onEmptyCmd = m_deckClickedParams[ 4 ];
		
		if ( $src.find( ".card" ).length === 0 ) {
			onEmptyCmd();
			return;
		}

		for( let i = 0; i < dealCount; i++ ) {
			dealCard( $src, $dest, true );	
		}
		onComplete( onCardDealt );
	}

	function calcDelay() {
		return m_animations * m_delay;
	}

	function runDealCardAnimation( $src, $dest, isFlip, noDelay ) {
		let timeout = setTimeout( function() {
			var $card, sourceOffset, destOffset;

			// Make sure there is at least one card in the deck
			if( $src.children().length === 0 ) {
				return;
			}

			// Get the card
			$card = $src.children().last();
			sourceOffset = $card.offset();

			// Move the card in the DOM
			$dest.append( $card );
			destOffset = $card.offset();

			$card
				.css( "position", "relative" )
				.css( "left", ( sourceOffset.left - destOffset.left ) + "px" )
				.css("top", ( sourceOffset.top - destOffset.top ) + "px");

			$card.animate( {
				"left": 0,
				"top": 0
			}, m_speed, function() {
				// Check if card has been removed from the DOM
				if( document.contains( $card.get( 0 ) ) ) {
					$card
						.css( "position", "" )
						.css( "left", "" )
						.css( "top", "" );
					animationCompleted( noDelay );
				}
			} );

			if( isFlip ) {
				if( $card.hasClass("card-flipped") ) {
					$card.removeClass( "card-flipped" );
				} else {
					$card.addClass( "card-flipped" );	
				}
			}
		}, calcDelay() );

		m_timeouts.push( timeout );
	}

	function runFlipCardAnimation( $src ) {
		let timeout = setTimeout( function () {
			// Make sure there is at least one card in the deck
			if( $src.children().length === 0 ) {
				return;
			}		
			$src.children().last().addClass( "card-flipped" );
			let timeout = setTimeout( animationCompleted, m_speed );
			m_timeouts.push( timeout );
		}, calcDelay() );

		m_timeouts.push( timeout );
	}

	function animationCompleted( noDelay ) {
		if( !noDelay ) {
			m_animations -= 1;	
		}
		if( m_animations === 0 ){
			let temp = m_onCompleteCommands.slice();
			m_onCompleteCommands = [];
			for( let i = 0; i < temp.length; i++ ) {
				temp[ i ]();
			}
		}
	}

})();
