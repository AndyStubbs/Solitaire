let g_uiDrag = (function() {
	"use strict";

	let m_$dragged = null;
	let m_startDrag = false;
	let m_canStartDrag = true;
	let m_mouse = null;
	let m_isDragging = false;
	let m_$dragCancelParent = null;
	let m_dragStartPosition = null;
	let m_stackClass = "";
	let m_canPlaceCardCmd = null;
	let m_speedPerPixel = 0.5;
	let m_isAnimating = false;
	let m_onCardPlacedCmd = null;

	return {
		"setupDragCards": setupDragCards,
		"updateSpeed": updateSpeed
	};

	function setupDragCards( cardSelector, stackClass, speedPerPixel, canPlaceCardCmd, onCardPlacedCmd ) {
		$( document.body ).on( "mousedown", cardSelector, startDrag );
		$( document.body ).on( "touchstart", cardSelector, touchStart );
		$( document.body ).on( "mousemove", dragMove );
		$( document.body ).on( "touchmove", touchMove );
		$( document.body ).on( "mouseup", stopDrag );
		$( document.body ).on( "touchend", touchEnd );
		$( window ).on( "blur", stopDrag );
		m_stackClass = stackClass;
		m_speedPerPixel = speedPerPixel;
		m_canPlaceCardCmd = canPlaceCardCmd;
		m_onCardPlacedCmd = onCardPlacedCmd;
	}

	function updateSpeed( speedPerPixel ) {
		m_speedPerPixel = speedPerPixel;
	}

	/*
 		Event Functions
 	*/

	function startDrag() {
		//console.log( "START DRAG" );
		if( ! m_canStartDrag ) {
			//console.log( "---SKIPPED" );
			return;
		}

		m_$dragged = $( this );
		m_startDrag = true;
	}

	function touchStart() {
		m_mouse = {
			"x": e.changedTouches[ 0 ].pageX,
			"y": e.changedTouches[ 0 ].pageY
		};
		//console.log( m_mouse );
		startDrag.apply( this );
	}

	function dragMove( e ) {
		var mouse, offset, newLeft, newTop, $elements, $stack;

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
			if( m_$dragged.parent().hasClass( m_stackClass ) ) {
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
			$stack = $elements.closest( "." + m_stackClass );
			if( $stack.length > 0 && m_canPlaceCardCmd( $stack, m_$dragged ) ) {
				m_$dragged.addClass( "can-drop-card" );
			} else {
				m_$dragged.removeClass( "can-drop-card" );
			}
		}

		m_mouse = mouse;
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

	function stopDrag() {
		var $elements, $stack, pos, $placeholder;

		//console.log( "STOP DRAG" );
		if( ! m_$dragged || ! m_dragStartPosition || m_startDrag ) {
			//console.log( "---SKIPPED" );
			m_$dragged = null;
			m_startDrag = false;
			return;
		}
		m_startDrag = false;
		m_isDragging = false;
		m_$dragged.hide();
		$elements = $( document.elementFromPoint( m_mouse.x, m_mouse.y ) );
		m_$dragged.show();
		$stack = $elements.closest( ".stack" );
		if( $stack.length > 0 && m_canPlaceCardCmd( $stack, m_$dragged ) ) {
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

	function touchEnd() {
		stopDrag();
	}

	/*
 		Internal Functions
 	*/

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
		$selectionBox.css( "height",
			( ( $selectionBox.children().length - 1 ) * cardOverlap + cardHeight ) + "px" );
		$selectionBox.show();

		return $selectionBox;
	}

	function moveToStack( $stack, pos ) {
		var speed, offset, dx, dy;

		if( ! m_$dragged || m_isAnimating ) {
			return;
		}

		offset = m_$dragged.offset();
		dx = offset.left - pos.left;
		dy = offset.top - pos.top;
		speed = Math.round( Math.sqrt( dx * dx + dy * dy ) * m_speedPerPixel ) + 100;
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
			m_onCardPlacedCmd();
		} );
	}

} )();
