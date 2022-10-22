let util = (function() {
	return {
		"isFunction": isFunction
	};
	function isFunction(functionToCheck) {
		return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
	}
})();