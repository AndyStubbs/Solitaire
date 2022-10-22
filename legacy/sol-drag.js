$( document ).ready( function () {
	var m_$dragged, m_dragStartPosition, m_mouse, m_$dragCancelParent, m_canStartDrag, m_isAnimating, m_startDrag, m_isDragging, m_isShrunk;

	$( document.body ).on( "mousedown", ".stack .card-flipped, #main-pile .card-flipped:nth-last-child(1)", startDrag );
	$( document.body ).on( "touchstart", ".stack .card-flipped, #main-pile .card-flipped:nth-last-child(1)", touchStart );
	$( document.body ).on( "mousemove", dragMove );
	$( document.body ).on( "touchmove", touchMove );
	$( document.body ).on( "mouseup", stopDrag );
	$( document.body ).on( "touchend", touchEnd );
	$( window ).on( "blur", stopDrag );
	$( document.body ).on( "dblclick", ".stack .card-flipped, #main-pile .card-flipped:nth-last-child(1)", cardDoubleClick );

	m_isDragging = false;
	m_isAnimating = false;
	m_canStartDrag = true;
	m_isShrunk = false;

	function getSelectionBox( $card ) {
		var $cards, $selectionBox, cardHeight, cardOverlap;

		if( $card.prev().length === 0 ) {
			$cards = $card.parent().children();
		} else {
			$cards = $card.prev().nextAll();
		}

		cardHeight = $cards.find( ".card-part" ).first().height();
		cardOverlap = cardHeight * 0.163;
		$selectionBox = $( "#selected-cards" );
		$selectionBox.append( $cards );
		$selectionBox.css( "height", ( ( $selectionBox.children().length  - 1 ) * cardOverlap + cardHeight ) + "px" );
		$selectionBox.show();

		return $selectionBox;
	}

	function touchStart( e ) {
		m_mouse = {
			"x": e.changedTouches[ 0 ].pageX,
			"y": e.changedTouches[ 0 ].pageY
		};
		//console.log( m_mouse );
		startDrag.apply( this );
	}

	function startDrag() {
		//console.log( "START DRAG" );
		if( ! m_canStartDrag ) {
			//console.log( "---SKIPPED" );
			return;
		}

		m_$dragged = $( this );
		m_startDrag = true;

	}

	function touchMove( e ) {
		var e2;

		e2 = {
			"clientX": e.changedTouches[ 0 ].pageX,
			"clientY": e.changedTouches[ 0 ].pageY
		};

		//console.log( e2 );

		dragMove( e2 );
	}

	function dragMove( e ) {
		var mouse, offset, newLeft, newTop;

		mouse = {
			"x": e.clientX,
			"y": e.clientY
		};

		if( m_startDrag ) {
			//console.log( "STARTING DRAG MOVE" );
			m_isDragging = true;
			m_startDrag = false;
			m_$dragCancelParent = m_$dragged.parent();
			m_dragStartPosition = m_$dragged.offset();
			if( m_$dragged.parent().hasClass( "stack" ) ) {
				m_$dragged = getSelectionBox( m_$dragged );
			}
			m_$dragged.css( "left", m_dragStartPosition.left );
			m_$dragged.css( "top", m_dragStartPosition.top );
			m_$dragged.css( "position", "absolute" );
			$( document.body ).append( m_$dragged );
			m_canStartDrag = false;
		}

		if( m_$dragged ) {
			//console.log( mouse );
			offset = m_$dragged.offset();
			newLeft = offset.left + ( mouse.x- m_mouse.x );
			newTop = offset.top + ( mouse.y - m_mouse.y );
			m_$dragged.css( "left", newLeft );
			m_$dragged.css( "top", newTop );

			// Detect if can drop card
			m_$dragged.hide();
			$elements = $( document.elementFromPoint( mouse.x, mouse.y ) );
			m_$dragged.show();
			$stack = $elements.closest( ".stack" );
			if( $stack.length > 0 && Sol.canPlaceCard( $stack, m_$dragged ) ) {
				m_$dragged.addClass( "can-drop-card" );
			} else {
				m_$dragged.removeClass( "can-drop-card" );
			}
		}

		m_mouse = mouse;
	}

	function touchEnd() {
		stopDrag();
	}

	function stopDrag() {
		var $elements, $stack, pos, $placeholder;

		//console.log( "STOP DRAG" );
		if( ! m_$dragged || ! m_dragStartPosition || m_startDrag ) {
			//console.log( "---SKIPPED" );
			return;
		}
		m_startDrag = false;
		m_isDragging = false;
		m_$dragged.hide();
		$elements = $( document.elementFromPoint( m_mouse.x, m_mouse.y ) );
		m_$dragged.show();
		$stack = $elements.closest( ".stack" );
		if( $stack.length > 0 && Sol.canPlaceCard( $stack, m_$dragged ) ) {
			$placeholder = $( "#card-placeholder" );
			$stack.append( $placeholder );
			$placeholder.show();
			pos = $placeholder.offset();
			$placeholder.hide();
			$( "#table" ).append( $placeholder );
			moveToStack( $stack, pos );
		} else {
			moveToStack( m_$dragCancelParent, m_dragStartPosition );
		}
	}

	function moveToStack( $stack, pos ) {
		var speed, offset, dx, dy;

		if( ! m_$dragged || m_isAnimating ) {
			return;
		}

		offset = m_$dragged.offset();
		dx = offset.left - pos.left;
		dy = offset.top - pos.top;
		speed = Math.round( Math.sqrt( dx * dx + dy * dy ) * Sol.getSpeed( "perPixel" ) ) + 100;
		m_isAnimating = true;
		m_$dragged.animate( {
			"left": pos.left,
			"top": pos.top
		}, speed, function () {
			if( m_$dragged[ 0 ].id === "selected-cards" ) {
				$stack.append( m_$dragged.children() );
				m_$dragged.hide();
			} else {
				$stack.append( m_$dragged );
			}
			m_$dragged
				.css( "position", "" )
				.css( "left", "" )
				.css( "top", "" );
			m_$dragged.removeClass( "can-drop-card" );
			m_$dragged = null;
			m_canStartDrag = true;
			m_isAnimating = false;
			checkSize();
		} );

	}

	function cardDoubleClick() {
		var $card, $stacks, i, $stack, pos1, pos2, speed, dx, dy;

		//console.log( "DOUBLE CLICK" );
		doubleClickTime = null;
		$card = $( this );
		$stacks = $( ".suit-stack" );
		for( i = 0; i < $stacks.length; i++ ) {
			$stack = $( $stacks.get( i ) );
			if( Sol.canPlaceCard( $stack, $card ) ) {
				pos1 = $card.offset();
				$stack.append( $card );
				pos2 = $card.offset();
				dx = pos1.left - pos2.left;
				dy = pos1.top - pos2.top;
				speed = Math.round( Math.sqrt( dx * dx + dy * dy ) * Sol.getSpeed( "perPixel" ) ) + 100;
				$( "#table" ).append( $card );
				$card.css( "position", "absolute" );
				$card.css( "left", pos1.left );
				$card.css( "top", pos1.top );
				$card.animate({
					"left": pos2.left,
					"top": pos2.top
				}, speed, function () {
					$card.css( "position", "" );
					$card.css( "left", "" );
					$card.css( "top", "" );
					$stack.append( $card );
					checkSize();
				} );
				break;
			}
		}
		m_$dragged = null;
		m_startDrag = false;
		m_canStartDrag = true;
	}

	function checkSize() {
		var height, $cards, maxCard, maxBottom, rect, bottom;

		var test = $( ".card-flipped:not(#stacks .card-flipped)" ).css( "height", "" );

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
		console.log( maxBottom, height );
		if( maxBottom > height ) {
			resize( height, maxCard );
		} else if( m_isShrunk ) {
			$( "#stacks .stack .card" ).css( "height", "" );
			m_isShrunk = false;
			checkSize();
		}
	}

	function resize( height, card ) {
		var rect, diff, $allCards, baseHeight, sizeMult;

		console.log( "Shrinking" );
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

});