let g_util = (function() {
	return {
		"isFunction": isFunction,
		"isMobile": isMobile,
		"openFullscreen": openFullscreen,
		"areElementsOverlapped": areElementsOverlapped,
		"findNearestElementFromList": findNearestElementFromList,
		"formatDate": formatDate,
		"padTo2Digits": padTo2Digits
	};

	function isFunction( functionToCheck ) {
		return functionToCheck && 
			{}.toString.call( functionToCheck ) === '[object Function]';
	}
	
	function isMobile() {
		if (
			navigator.userAgentData !== undefined &&
			navigator.userAgentData.mobile !== undefined ) {
			return navigator.userAgentData.mobile === true;
		}
		if (
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
			.test( navigator.userAgent )
		) {
			return true;
		}
		return false;
	}

	function openFullscreen( elem ) {
		if ( elem.requestFullscreen ) {
			elem.requestFullscreen();
		} else if ( elem.webkitRequestFullscreen ) { /* Safari */
			elem.webkitRequestFullscreen();
		} else if ( elem.msRequestFullscreen ) { /* IE11 */
			elem.msRequestFullscreen();
		}
	}

	function areElementsOverlapped( elem1, elem2 ) {
  		const rect1 = elem1.getBoundingClientRect();
		const rect2 = elem2.getBoundingClientRect();

		return !(
			rect1.top > rect2.bottom ||
			rect1.bottom < rect2.top ||
			rect1.left > rect2.right ||
			rect1.right < rect2.left
		);
	}

	function findNearestElementFromList( elements, x, y ) {
		let maxDist = 99999;
		let element = elements[ 0 ];
		for( let i = 0; i < elements.length; i++ ) {
			let rect = elements[ i ].getBoundingClientRect();
			let mx = rect.left + Math.round( rect.width / 2 );
			let my = rect.top + Math.round( rect.height / 2 );
			let dx = x - mx;
			let dy = y - my;
			let d = Math.sqrt( dx * dx + dy * dy );
			if( d < maxDist ) {
				maxDist = d;
				element = elements [ i ];
			}
		}

		return element;
	}
	
	function formatDate( date ) {
	  return [
	    date.getFullYear(),
	    padTo2Digits( date.getMonth() + 1 ),
	    padTo2Digits( date.getDate() ),
	  ].join( "-" );
	}

	function padTo2Digits( num ) {
  		return num.toString().padStart( 2, "0" );
	}
})();