let g_ui = (function() {
	"use strict";

	let m_speed = 300;
	let m_animations = 0;
	let m_delay = 150;
	let m_onCompleteCommands = [];

	return {
		"resize": resize,
		"createDeck": createDeck,
		"dealCard": dealCard,
		"flipCard": flipCard,
		"onComplete": onComplete
	};

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

	function createDeck(deck, $dest) {
		for (let i = 0; i < deck.length; i++) {
			let $card = createCard(deck[i].id);
			$dest.append($card);
		}
	}

	function dealCard($src, $dest) {
		runDealCardAnimation($src, $dest);
		m_animations += 1;
	}

	function flipCard($src) {
		runFlipCardAnimation($src);
		m_animations += 1;
	}

	function onComplete(cmd) {
		m_onCompleteCommands.push(cmd);
	}
	
	function createCard(value) {
		var $card, cardValue, cardSuit;

		cardSuit = getSuit(value);
		cardValue = getCardValue(value);
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

	function getSuit(card) {
		var suits = ["card-hearts", "card-clubs", "card-diamonds", "card-spades"];
		return suits[Math.floor(card / 13)];
	}

	function getCardNumber(value) {
		return (value % 13) + 1;
	}

	function getCardValue(card) {
		var value = getCardNumber(card);
		if (value === 1) {
			return "card-a";
		} else if (value === 11) {
			return "card-j";
		} else if (value === 12) {
			return "card-q";
		} else if (value === 13) {
			return "card-k";
		}

		return "card-" + value;
	}

	function runDealCardAnimation($src, $dest) {
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
				animationCompleted();
			});
		}, calcDelay());
	}

	function runFlipCardAnimation($src) {
		setTimeout( function () {
			//$card.find( ".card-part" ).css( "transition-duration", ( m_speed / 1000 ) + "s" );
			// Make sure there is at least one card in the deck
			if ($src.children().length === 0) {
				return;
			}		
			$src.children().last().addClass("card-flipped");
			setTimeout(animationCompleted, m_speed);
		}, calcDelay());
	}

	function animationCompleted() {
		m_animations -= 1;
		if(m_animations === 0){
			let temp = m_onCompleteCommands.slice();
			m_onCompleteCommands = [];
			for(let i = 0; i < temp.length; i++) {
				temp[i]();
			}
		}
	}
})();