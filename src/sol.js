let g_sol = ( function () {
	"use strict";

	const DRAW_COUNT = { "One": 1, "Three": 3 };
	const SPEED_FACTORS = { "Slow": 2, "Normal": 1, "Fast": 0.5 };
	let m_baseSpeed = 150;
	let m_slowSpeed = 500;
	let m_speedPerPixel = 0.5;
	let m_speedFactor = 1;
	let m_isShrunk = false;
	let m_resizeTimeout = null;
	let m_isRunning = false;
	let m_undoStack = [];
	let m_undoPointer = 0;
	let m_startTime = 0;
	let m_timePrevious = 0;
	let m_score = 0;
	let m_drawMode = "One";
	let m_scoreMode = "Standard";
	let m_deckCount = 0;
	let m_timeInterval = null;
	let m_timeouts = [];
	let m_winInterval = null;
	let m_isPaused = true;
	let m_doubleClicked = false;

	return {
		"init": init,
		"start": start,
		"continueGame": continueGame,
		"pause": pause,
		"isGameInProgress": isGameInProgress,
		"endGame": endGame,
		"getScoreMode": () => m_scoreMode,
		"getScore": () => m_score
	};

	function init() {
		let gameData = JSON.parse( localStorage.getItem( "sol_gameData" ) );
		if( gameData !== null ) {
			m_drawMode = gameData.drawMode;
			m_scoreMode = gameData.scoreMode;
			m_speedFactor = gameData.speedFactor;
			m_undoStack = gameData.undoStack;
			m_undoPointer = gameData.undoPointer;
			m_timePrevious = gameData.elapsedTime;
			if( gameData.undoStack.length > 0 ) {
				m_score = gameData.undoStack[ gameData.undoStack.length - 1 ].score;
			} else {
				m_score = 0;
			}
		}
	}

	function start( settings, isContinue ) {
		if( !isContinue ) {
			if( isGameInProgress() ) {
				endGame( false );
			}
			m_drawMode = settings.draw;
			m_scoreMode = settings.scoring;
			m_speedFactor = SPEED_FACTORS[ settings.speed ];
			reset();
		}
		m_isRunning = true;
		g_uiDrag.setupDragCards(
			".normal-stack .card-flipped, #main-pile .card-flipped:nth-last-child(1)" +
				", .stack .card-flipped:nth-last-child(1)",
			"stack",
			m_speedPerPixel * m_speedFactor,
			canPlaceCard,
			cardMoved
		);
		g_ui.setSpeed( m_baseSpeed * m_speedFactor );
		g_uiDrag.updateSpeed( m_speedPerPixel * m_speedFactor );
		if( !isContinue ) {
			g_ui.createDeck( g_cards.createDeck( true ), $( "#main-deck" ) );
			dealDeck();
		}
		resize();
		g_ui.setupDeckClick(
			$( "#main-deck" ),
			$( "#main-pile" ),
			DRAW_COUNT[ m_drawMode ],
			mainDeckCardDealt,
			mainDeckResetClicked
		);
		$( "#table" ).on( "click", ".stack", stackClicked );
		//$( document.body ).on( "dblclick",
		//	".normal-stack .card-flipped:nth-last-child(1), #main-pile .card-flipped:nth-last-child(1)",
		//	cardDoubleClick
		//);
    	$( document.body ).on(
			"click",
			".normal-stack .card-flipped:nth-last-child(1), #main-pile .card-flipped:nth-last-child(1)",
			cardClick
		);
		$( window ).on( "resize", onWindowResize );
		$( window ).on( "keypress", onKeypress );
		$( "#btn-undo" ).on( "click", undo );
	}

	function continueGame( settings ) {
		if( m_isRunning ) {
			m_speedFactor = SPEED_FACTORS[ settings.speed ];
			g_ui.setSpeed( m_baseSpeed * m_speedFactor );
			g_uiDrag.updateSpeed( m_speedPerPixel * m_speedFactor );
			unpauseTime();
		} else {
			restoreState( m_undoStack[ m_undoStack.length - 1 ] );
			start( settings, true );
			unpauseTime();
		}
	}

	function pause() {
		if( ! m_isPaused ) {
			let elapsed = calcElapsedTime();
			m_timePrevious = elapsed;
		}
		m_isPaused = true;
		clearInterval( m_timeInterval );
		clearInterval( m_winInterval );
	}

	function calcElapsedTime() {
		let t = ( new Date ).getTime();
		if( m_startTime === 0 ) {
			m_startTime = t;
		}
		return ( t - m_startTime ) + m_timePrevious;
	}

	function isGameInProgress() {
		return m_isRunning || m_undoStack.length > 0;		
	}

	/*
 		Event Functions
 	*/

	function mainDeckCardDealt() {
		mainDeckChecks();
		saveState();
	}

	function mainDeckResetClicked() {
		let $mainDeck = $( "#main-deck" );
		$mainDeck.html( "" );
		g_ui.setSpeed( m_slowSpeed * m_speedFactor );
		$( "#main-pile .card" ).each(function () {
			g_ui.dealCard( $( "#main-pile" ), $mainDeck, true, true );
		} );
		let timeout = setTimeout( function () {
			g_ui.setSpeed( m_baseSpeed * m_speedFactor );
			let timeout = setTimeout( function () {
				saveState();
			}, 50 );
			m_timeouts.push( timeout );
		}, m_slowSpeed * m_speedFactor );
		m_timeouts.push( timeout );
		m_deckCount += 1;
		if( m_scoreMode === "Standard" ) {
			if( m_drawMode === "One" ) {
				updateScore( -25 );	
			} else {
				if( m_deckCount % 3 === 0 ) {
					updateScore( -25 );
				}
			}
		}
	}

	function stackClicked() {
		var $card, $stack;

		$stack = $( this );
		$card = $stack.children().last();
		if ( $card.length > 0 && $card.hasClass( "card" ) && !$card.hasClass( "card-flipped" ) ) {
			g_ui.flipCard( $stack );
			g_ui.onComplete( function () {
				saveState();
			} );
			if( m_scoreMode === "Standard" ) {
				updateScore( 5 );
			}
		}
	}

	function cardClick() {
		if( m_doubleClicked ) {
			cardDoubleClick( $( this ) );
		}
		m_doubleClicked = true;
		setTimeout( () => {
			m_doubleClicked = false;
		}, 300 );		
	}

	function cardDoubleClick( $card ) {
		checkCardForAutoPlay( $card );
	}

	function cardMoved( $src, $dest, isCancelled ) {
		if( !isCancelled ) {
			if( $dest.hasClass( "suit-stack" ) && !$src.hasClass( "suit-stack" ) ) {
				if( m_scoreMode === "Standard" ) {
					if( $src.hasClass( "main-pile" ) ) {
						updateScore( 13 );
					} else {
						updateScore( 10 );	
					}
				} else {
					updateScore( 5 );
				}
			} else if( $src.hasClass( "suit-stack" ) && m_scoreMode === "Standard" ) {
				updateScore( -13 );
			} else if( $src.hasClass( "main-pile" ) && m_scoreMode === "Standard" ) {
				updateScore( 3 );
			}
		}
		mainDeckChecks();
		checkSize();
		saveState();
	}
	
	function onWindowResize() {
		clearTimeout( m_resizeTimeout );
		m_resizeTimeout = setTimeout( resize, 100 );
		if( g_util.isMobile() && !g_util.isFullscreen() ) {
			$( "#btn-fullscreen" ).show();
		} else {
			$( "#btn-fullscreen" ).hide();
		}
	}

	function onKeypress( e ) {
		if( e.key.toLowerCase() === "z" && e.ctrlKey ) {
			undo();
		}
		if( e.key.toLowerCase() === "y" && e.ctrlKey ) {
			$( "#suit-1" ).append( $( ".card:not(#card-placeholder)" ) );
			saveState();
		}
	}

	/*
 		Internal Functions
 	*/

	function undo() {
		if( m_undoPointer >= m_undoStack.length || m_undoPointer < 0 ) {
			return;
		}
		restoreState( m_undoStack[ m_undoPointer ] );
		m_undoPointer -= 1;
		for( let i = m_undoPointer + 1; i < m_undoStack.length; i++ ) {
			m_undoStack.pop();
		}
		updateUndoStack();
	}

	function checkCardForAutoPlay( $card, onComplete ) {
		var $parent, $stacks, i, $stack;

		$parent = $card.parent();
		$stacks = $( ".suit-stack" );
		for( i = 0; i < $stacks.length; i++ ) {
			$stack = $( $stacks.get( i ) );
			if( canPlaceCard( $stack, $card ) ) {
				g_ui.dealCard( $card.parent(), $stack );
				g_ui.onComplete( function () {
					checkSize();
					saveState();
					if( onComplete ) {
						onComplete();
					}
				} );
				if( m_scoreMode === "Standard" ) {
					if( $parent.hasClass( "main-pile" ) ) {
						updateScore( 13 );	
					} else {
						updateScore( 10 );
					}
				} else {
					updateScore( 5 );	
				}
				break;
			}
		}
		g_uiDrag.resetDrag();
	}

	function checkForAutoPlay() {
		let minCard = 100;
		$( ".suit-stack" ).each( function () {
			if( minCard === null ) {
				return;
			}
			let $topCard = $( this ).children().last();
			if( $topCard.length > 0 ) {
				let top = g_cards.getNumber( parseInt( $topCard.get( 0 ).dataset.card ) );
				if( top < minCard ) {
					minCard = top;
				}
			} else {
				minCard = null;
			}
		} );
		if( minCard !== null ) {
			$( ".normal-stack" ).each( function () {
				let $topCard = $( this ).children().last();
				if( $topCard.length > 0 && $topCard.hasClass( "card-flipped" ) ) {
					let cardValue = g_cards.getNumber( parseInt( $topCard.get( 0 ).dataset.card ) );
					if( cardValue === minCard + 1 ) {
						checkCardForAutoPlay( $topCard );
					}
				}
			} );
		}
	}

	function checkForWin() {
		if( $( "#suit-stacks .card" ).length === 52 ) {
			endGame( true );
			$( "#game-over" ).fadeIn();
			m_winInterval = setInterval( winAnimation, 100 );
		}
	}

	function endGame( isWin ) {
		if( m_isRunning ) {
			saveGame( isWin );	
		}
		m_isRunning = false;
		resetInput();
		m_undoStack = [];
		m_undoPointer = 0;
		m_deckCount = 0;
		pause();
		m_startTime = 0;
		m_timePrevious = 0;
		m_score = 0;
	}

	function saveGame( isWin ) {
		let gameStats = JSON.parse( localStorage.getItem( "sol_gameStats" ) );
		if( gameStats === null ) {
			gameStats = [];
		}
		let elapsed = calcElapsedTime() / 1000;
		if( m_scoreMode === "Vegas" ) {
			g_menu.setVegasStartScore( m_score );
			m_score -= g_menu.getVegasStartScore();
		}
		gameStats.push( {
			"date": ( new Date() ).getTime(),
			"mode": m_scoreMode,
			"draw": m_drawMode,
			"score": m_score,
			"time": elapsed,
			"deckCount": m_deckCount,
			"isWin": isWin,
			//"cards": m_undoStack[ 0 ]
		} );
		localStorage.setItem( "sol_gameStats", JSON.stringify( gameStats ) );
	}

	function winAnimation() {
		let $window = $( window );
		let height = $window.height();
  		let width = $window.width();
		let topHeight = $( "#score-bar" ).height();
		$( "#game-over" ).css( "top", topHeight );
		$( "#game-over h1" ).css( "top", "calc(50% - " + ( topHeight + 80 ) + "px)" );
		$( "#suit-stacks .card" ).each( function () {
			if( Math.random() > 0.15 ) {
				return;
			}
			let $card = $( this );
			let offset = $card.offset();
			$card.css( "position", "fixed" );
			$card.css( "left", offset.left );
			$card.css( "top", offset.top );
			$card.animate( {
				"left": Math.floor( ( width - $card.width() ) * Math.random() ),
				"top": Math.floor(
					( height - $card.find( ".card-part" ).height() - topHeight ) * Math.random()
				) + topHeight
			}, Math.round( Math.random() * 2000 ) + 2000 );
		} );
	}

	function mainDeckChecks() {
		if( m_scoreMode === "Vegas" ) {
			if( $( "#main-deck .card" ).length === 0 ) {
				let $mainDeck = $( "#main-deck" );
				$mainDeck.html( "" );
				if( m_drawMode === "One" || m_deckCount === 2 ) {
					g_ui.disableDeckClick( $mainDeck );
					$mainDeck.css( "cursor", "default" );
					$mainDeck.append( "<span style='color: red;'>X</span>" );
				} else {
					$mainDeck.append( "<span style='color: green;'>" + ( m_deckCount + 1 ) + "</span>" );
				}
			}
		} else {
			if( $( "#main-deck .card" ).length === 0 ) {
				let $mainDeck = $( "#main-deck" );
				$mainDeck.html( "" );
				if( $( "#main-pile .card" ).length === 0 ) {
					g_ui.disableDeckClick( $mainDeck );
					$mainDeck.css( "cursor", "default" );
					$mainDeck.append( "<span style='color: red;'>X</span>" );
				} else {
					$mainDeck.append( "<span style='color: green;'>" + ( m_deckCount + 1 ) + "</span>" );	
				}
			}
		}
	}

	function reset() {
		m_undoStack = [];
		m_undoPointer = 0;
		m_deckCount = 0;
		$( "#main-deck" ).html( "" );
		$( ".card:not(#card-placeholder)" ).remove();
		resetInput();
		m_timePrevious = 0;
		if( m_scoreMode === "Standard" ) {
			m_score = 0;
		} else {
			m_score = g_menu.getVegasStartScore();
			m_score -= 52;
		}
		updateScore( 0 );
		$( "#timer" ).html( "Time: 0" );
	}

	function resetInput() {
		$( "#table" ).off( "click", ".stack", stackClicked );
		//$( document.body ).off( "dblclick",
		//	".normal-stack .card-flipped:nth-last-child(1), #main-pile .card-flipped:nth-last-child(1)",
		//	cardDoubleClick
		//);
		$( document.body ).off(
			"click",
			".normal-stack .card-flipped:nth-last-child(1), #main-pile .card-flipped:nth-last-child(1)",
			cardClick
		);
		$( window ).off( "resize", onWindowResize );
		$( window ).off( "keypress", onKeypress );
		m_timeouts.forEach( function ( timeout ) {
			clearTimeout( timeout );
		} );
		g_ui.reset( $( "#main-deck" ) );
		g_uiDrag.reset();
		$( "#btn-undo" ).off( "click", undo );
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
		g_ui.onComplete( function () {
			for( let i = 1; i < 8; i++ ) {
				g_ui.flipCard( $( "#stack-" + i ) );
			}
			g_ui.onComplete( function () {
				saveState();
				unpauseTime();
			} );
		} );
	}

	function unpauseTime() {
		m_startTime = ( new Date ).getTime();
		clearInterval( m_timeInterval );
		m_timeInterval = setInterval( timeTick, 100 );
		m_isPaused = false;
	}

	function timeTick() {
		let elapsed = calcElapsedTime() / 1000;
		$( "#timer" ).html( "Time: " + elapsed.toFixed( 0 ) );
	}

	function updateScore( change ) {
		var temp, dollar;

		m_score += change;

		if( m_scoreMode === "Standard" ) {
			dollar = "";
		} else {
			dollar = "$";
		}
		if( m_score < 0 ) {
			temp = "<span style='color: red'>" + "-" + dollar + Math.abs( m_score ) + "</span>";
		} else {
			temp = m_score;
		}
		
		$( "#score" ).html( "Score: " + temp );
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

	function saveState() {
		let data = {
			"score": m_score,
			"deckCount": m_deckCount,
			"cards": []
		};
		$( ".card:not(#card-placeholder)" ).each( function () {
			if( !this.dataset.card ) {
				return;
			}
			let $card = $( this );
			data.cards.push( {
				"value": parseInt( this.dataset.card ),
				"flip": $card.hasClass( "card-flipped" ),
				"parentId": $card.parent().get( 0 ).id
			} );
		} );

		// Make sure the undo stack is not the same as new stack
		if(
			m_undoStack.length === 0 ||
			!compareStacks( data.cards, m_undoStack[ m_undoStack.length - 1 ].cards )
		) {
			m_undoStack.push( data );
			m_undoPointer = m_undoStack.length - 2;
			checkForWin();
			updateUndoStack();
			checkForAutoPlay();
		}
	}

	function compareStacks( stack1, stack2 ) {
		for( let i = 0; i < stack1.length; i++ ) {
			if(
				!stack2[ i ] ||
				stack1[ i ].value !== stack2[ i ].value ||
				stack1[ i ].flip !== stack2[ i ].flip ||
				stack1[ i ].parentId !== stack2[ i ].parentId
			) {
				return false;
			}
		}
		return true;
	}

	function restoreState( data ) {
		g_uiDrag.resetDrag();

		$( ".card:not(#card-placeholder)" ).remove();
		$( "#main-deck" ).html( "" );
		for( let i = 0; i < data.cards.length; i++ ) {
			let cardData = data.cards[ i ];
			let $card = $( g_ui.createCard( cardData.value ) );
			if( cardData.flip ) {
				$card.addClass( "card-flipped" );
			}
			$( "#" + cardData.parentId ).append( $card );
		}
		m_score = data.score;
		m_deckCount = data.deckCount;		
		mainDeckChecks();
		updateScore( 0 );
		resize();
		checkSize();
	}

	function updateUndoStack() {
		let elapsedTime = calcElapsedTime();
		let gameData = {
			"drawMode": m_drawMode,
			"scoreMode": m_scoreMode,
			"speedFactor": m_speedFactor,
			"undoStack": m_undoStack,
			"undoPointer": m_undoPointer,
			"elapsedTime": elapsedTime
		};
		localStorage.setItem( "sol_gameData", JSON.stringify( gameData ) );

		// Clear the undo stack
		$( "#undo-data" ).html( "" );
		for( let i = 0; i < m_undoStack.length; i++ ) {
			let $div = $( "<div>" );
			if( i === m_undoPointer ) {
				$div.html( "* Undo " + i );	
			} else {
				$div.html( "Undo " + i );
			}
			
			$div.data( "index", i )
			$div.on( "click", function () {
				let index = $( this ).data( "index" );
				restoreState( m_undoStack[ index ] );
			} );
			$( "#undo-data" ).append( $div );
		}

	}

} )();
