let g_util = (function() {
	return {
		"isFunction": isFunction,
		"isMobile": isMobile,
		"openFullscreen": openFullscreen
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
})();