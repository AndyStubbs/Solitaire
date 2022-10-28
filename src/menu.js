let g_menu = ( function() {
	"use strict";

	let m_menu = {
		"status": "init",
		"state": "hidden"
	};

	let m_settings = {
		"draw": "One",
		"scoring": "Standard"
	};

	return {
		"init": init,
		"resize": resize
	};

	function init() {
		$( "#menu" ).show();
		$( "#btn-start" ).on( "click", function() {
			$( "#menu" ).hide();
			g_sol.start();
			if( g_util.isMobile() ) {
				g_util.openFullscreen( document.body );
				if ( "orientation" in screen ) {
					screen.orientation.lock( "landscape-primary" );
				}
			}
		} );
		$( "#btn-settings" ).on( "click", function () {
			$( "#menu-main" ).hide();
			$( "#menu-settings" ).show();
			$( "#select-draw" ).val( m_settings.draw );
			$( "#select-scoring" ).val( m_settings.scoring );
		} );
		$( "#btn-ok" ).on( "click", function () {
			m_settings.draw = $( "#select-draw" ).val();
			m_settings.scoring = $( "#select-scoring" ).val();
			$( "#menu-main" ).show();
			$( "#menu-settings" ).hide();
		} );
		$( "#btn-cancel" ).on( "click", function () {
			$( "#menu-main" ).show();
			$( "#menu-settings" ).hide();
		} );
	}

	function resize( height ) {
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

})();

$( window ).on( "load", function() {
	// TODO: Add loading screen and hide it here
	g_menu.init();
} );