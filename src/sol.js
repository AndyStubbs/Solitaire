let g_sol = ( function () {
	"use strict";

	const DRAW_COUNT = { "One": 1, "Three": 3 };
	let m_baseSpeed = 150;
	let m_slowSpeed = 500;
	let m_speedPerPixel = 0.5;
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

	return {
		"start": start
	};
	
	function start( settings ) {
		m_drawMode = settings.draw;
		m_scoreMode = settings.scoring;
		if( m_scoreMode === "Standard" ) {
			m_score = 0;
		} else {
			m_score = -52;
		}
		updateScore( 0 );
		m_isRunning = true;
		g_uiDrag.setupDragCards(
			".normal-stack .card-flipped, #main-pile .card-flipped:nth-last-child(1)" +
				", .stack .card-flipped:nth-last-child(1)",
			"stack",
			m_speedPerPixel,
			canPlaceCard,
			cardMoved
		);
		g_ui.createDeck( g_cards.createDeck( true ), $( "#main-deck" ) );
		g_ui.setSpeed( m_baseSpeed );
		dealDeck();
		resize();
		g_ui.setupDeckClick(
			$( "#main-deck" ),
			$( "#main-pile" ),
			DRAW_COUNT[ m_drawMode ],
			mainDeckCardDealt,
			mainDeckResetClicked
		);
		$( "#table" ).on( "click", ".stack", stackClicked );
		$( document.body ).on( "dblclick",
			".normal-stack .card-flipped:nth-last-child(1), #main-pile .card-flipped:nth-last-child(1)",
			cardDoubleClick
		);
		$( window ).on( "resize", onWindowResize );
		$( window ).on( "keypress", onKeypress );
	}

	/*
 		Event Functions
 	*/

	function mainDeckCardDealt() {
		saveState();
	}

	function mainDeckResetClicked() {
		g_ui.setSpeed( m_slowSpeed );
		$( "#main-pile .card" ).each(function () {
			g_ui.dealCard( $( "#main-pile" ), $( "#main-deck" ), true, true );
		} );
		setTimeout( function () {
			g_ui.setSpeed( m_baseSpeed );
			setTimeout( function () {
				saveState();
			}, 50 );
		}, m_slowSpeed );
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

		if( !m_isRunning ) {
			return;
		}

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

	function cardDoubleClick() {
		var $card, $parent, $stacks, i, $stack;

		$card = $( this );
		$parent = $card.parent();
		$stacks = $( ".suit-stack" );
		for( i = 0; i < $stacks.length; i++ ) {
			$stack = $( $stacks.get( i ) );
			if( canPlaceCard( $stack, $card ) ) {
				g_ui.dealCard( $card.parent(), $stack );
				g_ui.onComplete( function () {
					checkSize();
					saveState();
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
		checkSize();
		saveState();
	}
	
	function onWindowResize() {
		// TODO: Add a loading screen when resizing cards
		clearTimeout( m_resizeTimeout );
		m_resizeTimeout = setTimeout( resize, 100 );
	}

	function onKeypress( e ) {
		if( e.key.toLowerCase() === "z" && e.ctrlKey ) {
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
		setInterval( timeTick, 100 );
	}

	function timeTick() {
		let t = ( new Date ).getTime();
		let elapsed = ( ( t - m_startTime ) + m_timePrevious ) / 1000;
		$( "#timer" ).html( "Time: " + elapsed.toFixed( 0 ) );
	}

	function updateScore( change ) {
		var temp;

		m_score += change;
		if( m_scoreMode === "Standard" ) {
			temp = m_score;
		} else {
			if( m_score < 0 ) {
				temp = "<span style='color: red'>" + "-$" + Math.abs( m_score ) + "</span>";
			} else {
				temp = m_score;
			}
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
			updateUndoStack();
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
		for( let i = 0; i < data.cards.length; i++ ) {
			let cardData = data.cards[ i ];
			let $card = $( g_ui.createCard( cardData.value ) );
			if( cardData.flip ) {
				$card.addClass( "card-flipped" );
			}
			$( "#" + cardData.parentId ).append( $card );
		}
		m_score = data.score;
		updateScore( 0 );
		resize();
		checkSize();
	}

	function updateUndoStack() {

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
