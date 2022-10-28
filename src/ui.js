let g_ui = (function() {
	"use strict";

	let m_speed = 150;
	let m_animations = 0;
	let m_delay = 75;
	let m_onCompleteCommands = [];
	let m_deckClickedParams;

	return {
		"createDeck": createDeck,
		"dealCard": dealCard,
		"flipCard": flipCard,
		"onComplete": onComplete,
		"setupDeckClick": setupDeckClick,
		"setSpeed": setSpeed
	};

	function createDeck( deck, $dest ) {
		for( let i = 0; i < deck.length; i++ ) {
			let $card = createCard( deck[ i ]);
			$dest.append( $card );
		}
	}

	function dealCard($src, $dest, isFlip, noDelay) {
		runDealCardAnimation($src, $dest, isFlip, noDelay);
		if(!noDelay) {
			m_animations += 1;	
		}
	}

	function flipCard( $src ) {
		runFlipCardAnimation( $src );
		m_animations += 1;
	}

	function onComplete(cmd) {
		m_onCompleteCommands.push(cmd);
	}

	function setupDeckClick($src, $dest, onEmptyCmd) {
		m_deckClickedParams = [ $src, $dest, onEmptyCmd ];
		$src.on("click", deckClicked);
	}

	function setSpeed(speed) {
		m_speed = speed;
		$( ".card-part" ).css( "transition-duration", ( m_speed / 1000 ) + "s" );
	}

	/*
 		Internal Functions
 	*/

	function deckClicked() {
		let $src, $dest, onEmptyCmd;
		$src = m_deckClickedParams[ 0 ];
		$dest = m_deckClickedParams[ 1 ];
		onEmptyCmd = m_deckClickedParams[ 2 ];
		
		if ( $src.children().length === 0 ) {
			onEmptyCmd();
			return;
		}

		dealCard( $src, $dest, true );
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

	function calcDelay() {
		return m_animations * m_delay;
	}

	function runDealCardAnimation($src, $dest, isFlip, noDelay) {
		setTimeout(function() {
			var $card, sourceOffset, destOffset;

			// Make sure there is at least one card in the deck
			if ($src.children().length === 0) {
				return;
			}

			// Get the card
			$card = $src.children().last();
			sourceOffset = $card.offset();

			// Move the card in the DOM
			$dest.append($card);
			destOffset = $card.offset();

			//$card.find( ".card-part" ).css( "transition-duration", ( m_speed / 1000 ) + "s" );

			$card
				.css("position", "relative")
				.css("left", (sourceOffset.left - destOffset.left) + "px")
				.css("top", (sourceOffset.top - destOffset.top) + "px");

			$card.animate({
				"left": 0,
				"top": 0
			}, m_speed, function() {
				$card
					.css("position", "")
					.css("left", "")
					.css("top", "");
				animationCompleted(noDelay);
			});

			if (isFlip) {
				if ($card.hasClass("card-flipped")) {
					$card.removeClass("card-flipped");
				} else {
					$card.addClass("card-flipped");	
				}
			}
		}, calcDelay());
	}

	function runFlipCardAnimation( $src ) {
		setTimeout( function () {
			// Make sure there is at least one card in the deck
			if( $src.children().length === 0 ) {
				return;
			}		
			$src.children().last().addClass( "card-flipped" );
			setTimeout( animationCompleted, m_speed );
		}, calcDelay() );
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