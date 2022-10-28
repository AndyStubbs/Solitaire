let g_uiDrag = (function() {
	let m_$dragged = null;
	let m_startDrag = false;
	
	return {
		"setupDragCards": setupDragCards
	};

	function setupDragCards( cardSelector ) {
		$( document.body ).on( "mousedown", cardSelector, startDrag );
		$( document.body ).on( "touchstart", cardSelector, touchStart );
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

	function touchStart() {
		m_mouse = {
			"x": e.changedTouches[ 0 ].pageX,
			"y": e.changedTouches[ 0 ].pageY
		};
		//console.log( m_mouse );
		startDrag.apply( this );
	}

} )();
