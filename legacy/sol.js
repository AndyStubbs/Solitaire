$(document).ready(function() {

	//Sol.start();

	//if( $( "#table" ).width() < 1160 || $( "#table" ).height() < 600 ) {
	$("#menu").show();
	//} else {
	//	Sol.start();
	//}

	$("#btn-start").on("click", function() {
		$("#menu").hide();
		Sol.start();
		if (isMobile()) {
			openFullscreen(document.body);
			if ("orientation" in screen) {
				screen.orientation.lock("landscape-primary");
			}
		}
	});

	function isMobile() {
		if (navigator.userAgentData !== undefined && navigator.userAgentData.mobile !== undefined) {
			return navigator.userAgentData.mobile === true;
		}
		if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
			return true;
		}
		return false;
	}

	function openFullscreen(elem) {
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if (elem.webkitRequestFullscreen) { /* Safari */
			elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) { /* IE11 */
			elem.msRequestFullscreen();
		}
	}
});

var Sol = (function() {

	var m_speeds, m_settings, m_isRunning, m_menu;

	m_menu = {
		"status": "init",
		"state": "hidden"
	};
	m_isRunning = false;

	m_speeds = {
		"flip": 500,
		"deal": 150,
		"dealBuffer": 50,
		"dealDelay": 500,
		"undeal": 50,
		"perPixel": 0.5
	};

	m_settings = {
		"speed": 0.5
	};

	resize();

	$("#main-deck").on("click", mainDeckClicked);
	$("#table").on("click", ".stack", stackClicked);
	$("#score-bar").on("click", scoreBarClicked);
	$(document.body).on("mousedown", ":not(#score-bar)", scoreBarToggleOff);

	return {
		"start": StartGame,
		"canPlaceCard": CanPlaceCard,
		"getSpeed": GetSpeed
	};

	function StartGame() {
		var i, deck, timeout;

		$(window).on("resize", function() {
			clearTimeout(timeout);
			timeout = setTimeout(resize, 500);
		});

		setSpeed();
		deck = [];
		for (i = 0; i < 52; i++) {
			deck.push(i);
		}
		//shuffleDeck( deck );
		createMainDeck(deck);
		dealMainDeck();
	}

	function GetSpeed(name) {
		return m_speeds[name];
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

		if (height > 900) {
			m_menu.status = "default";
			$("#score-toggle").hide();
			$("#score-bar-placeholder").show();
			$("#score-bar").css("top", 0);
		} else {
			m_menu.status = "toggle";
			$("#score-bar-placeholder").hide();
			if (m_menu.state === "hidden") {
				$("#score-toggle").show();
				$("#score-bar").css("top", -48);
			} else {
				$("#score-toggle").hide();
				$("#score-bar").css("top", 0);
			}
		}
	}

	function scoreBarClicked() {
		if (m_menu.status === "toggle" && m_menu.state === "hidden") {
			m_menu.state = "animating";
			$("#score-toggle").slideToggle();
			$("#score-bar").animate({
				"top": 0
			}, 500, function() {
				m_menu.state = "visible";
			});
		}
	}

	function scoreBarToggleOff() {
		console.log("Body Mousedown");
		if ($(this).closest("#score-bar").length > 0) {
			return;
		}

		if (m_menu.status === "toggle" && m_menu.state === "visible") {
			m_menu.state = "animating";
			$("#score-toggle").slideToggle();
			$("#score-bar").animate({
				"top": -48
			}, 500, function() {
				m_menu.state = "hidden";
			});
		}
	}

	function setSpeed() {
		m_speeds.flip *= m_settings.speed;
		m_speeds.deal *= m_settings.speed;
		m_speeds.dealBuffer *= m_settings.speed;
		m_speeds.dealDelay *= m_settings.speed;
		m_speeds.undeal *= m_settings.speed;
	}

	function CanPlaceCard($stack, $card) {
		var valueCard, $stackCard, valueStack, cardNumber, stackNumber, isSuitStack;

		if ($card.get(0).id === "selected-cards") {
			$card = $card.children().first();
		}

		isSuitStack = $stack.hasClass("suit-stack");

		valueCard = parseInt($card.get(0).dataset.card);
		cardNumber = getCardNumber(valueCard);
		$stackCard = $stack.children().last();
		if ($stackCard.length === 0) {
			return (cardNumber === 13 && !isSuitStack) || (cardNumber === 1 && isSuitStack);
		}

		valueStack = parseInt($stackCard.get(0).dataset.card);
		stackNumber = getCardNumber(valueStack);

		if (isSuitStack) {
			return getSuit(valueCard) === getSuit(valueStack) && cardNumber === stackNumber + 1;
		}

		if (areCardsSameColor(valueCard, valueStack)) {
			return false;
		}

		if (cardNumber === stackNumber - 1) {
			return true;
		}
		return false;
	}

	function shuffleDeck(deck) {
		var count, index;
		count = deck.length;
		while (count > 0) {
			index = Math.floor(Math.random() * count);
			deck.push(deck.splice(index, 1)[0]);
			count -= 1;
		}
	}

	function createMainDeck(deck) {
		var i, $mainDeck;

		$mainDeck = $("#main-deck");
		for (i = 0; i < deck.length; i++) {
			$mainDeck.append(createCard(deck[i]));
		}
	}

	function dealMainDeck() {
		var i, j, $mainDeck, $stack, delay, speed;

		speed = m_speeds.deal;
		delay = m_speeds.dealDelay;
		$mainDeck = $("#main-deck");
		for (i = 1; i < 8; i += 1) {
			for (j = 8 - i; j < 8; j += 1) {
				$stack = $("#stack-" + i);
				dealCardDelayed($mainDeck, $stack, false, delay, speed * 2);
				delay += speed;
			}
		}
		setTimeout(function() {
			var delay2 = 0;
			$(".stack .card:nth-last-child(1)").each(function() {
				flipCardDelayed($(this), delay2, m_speeds.flip);
				delay2 += speed;
			});
			m_isRunning = true;
		}, delay);
	}

	function flipCardDelayed($card, delay, speed) {
		$(".card-part").css("transition-duration", (speed / 1000) + "s");
		setTimeout(function() {
			$card.addClass("card-flipped");
		}, delay);
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

		return $card;
	}

	function stackClicked() {
		var $card;

		if (!m_isRunning) {
			return;
		}

		$card = $(this).children().last();
		if ($card.length > 0 && $card.hasClass("card") && !$card.hasClass("card-flipped")) {
			$card.addClass("card-flipped");
		}
	}

	function mainDeckClicked() {
		var $deck, $target, $cards, delay, speed;

		if (!m_isRunning) {
			return;
		}

		$deck = $(this);
		if ($deck.children().length === 0) {
			$cards = $("#main-pile .card");
			delay = 0;
			speed = m_speeds.undeal;
			$cards.each(function() {
				undealCardDelayed($(this), delay, speed);
				delay += speed;
			});
			return;
		}
		$target = $("#" + this.dataset.target);
		delay = 0;
		dealCardDelayed($deck, $target, true, delay, m_speeds.deal);
		// delay += m_speeds.deal + m_speeds.dealBuffer;
		// dealCardDelayed( $deck , $target, true, delay, m_speeds.deal );
		// delay += m_speeds.deal + m_speeds.dealBuffer;
		// dealCardDelayed( $deck , $target, true, delay, m_speeds.deal );
	}

	function undealCardDelayed($card, delay, speed) {
		setTimeout(function() {
			var pos1, pos2;
			pos1 = $card.offset();
			$("#main-deck").prepend($card);
			pos2 = $card.offset();
			$("#table").append($card);

			$card.css("position", "absolute");
			$card.css("left", pos1.left);
			$card.css("top", pos1.top);
			$card.animate({
				"left": pos2.left,
				"top": pos2.top
			}, speed, function() {
				$("#main-deck").prepend($card);
				$card.css("position", "");
				$card.css("left", "");
				$card.css("top", "");
			});
			$card.removeClass("card-flipped");
		}, delay);
	}

	function dealCardDelayed($deck, $target, isFlip, delay, speed) {
		setTimeout(function() {
			if ($deck.children().length > 0) {
				dealCard($deck, $target, isFlip, speed);
			}
		}, delay);
	}

	function dealCard($deck, $target, isFlip, speed) {
		var $card, sourceOffset, targetOffset;

		// Get the card
		$card = $deck.children().last();
		sourceOffset = $card.offset();

		// Move the card in the DOM
		$target.append($card);
		targetOffset = $card.offset();

		$card.find(".card-part").css("transition-duration", (speed / 1000) + "s");

		$card
			.css("position", "relative")
			.css("left", (sourceOffset.left - targetOffset.left) + "px")
			.css("top", (sourceOffset.top - targetOffset.top) + "px");

		$card.animate({
			"left": 0,
			"top": 0
		}, speed, function() {
			$card
				.css("position", "")
				.css("left", "")
				.css("top", "");
		});

		if (isFlip) {
			$card.addClass("card-flipped");
		}
	}

	function areCardsSameColor(card1, card2) {
		return (isCardRed(card1) && isCardRed(card2)) || (!isCardRed(card1) && !isCardRed(card2));
	}

	function isCardRed(card) {
		var suit;

		suit = getSuit(card);
		return suit === "card-hearts" || suit === "card-diamonds";
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

})();