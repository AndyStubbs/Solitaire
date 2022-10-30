let g_menu = ( function() {
	"use strict";

	let m_menu = {
		"status": "init",
		"state": "hidden"
	};

	let m_settings = {
		"draw": "One",
		"scoring": "Standard",
		"speed": "Normal"
	};

	return {
		"init": init,
		"resize": resize
	};

	function init() {
		$( "#loading-overlay" ).fadeOut();
		g_sol.init();
		if( !g_sol.isGameInProgress() ) {
			$( "#btn-continue" ).hide();
		}
		$( "#menu" ).show();
		$( "#btn-menu" ).on( "click", function () {
			g_sol.pause();
			$( "#menu" ).slideToggle();
			if( g_sol.isGameInProgress() ) {
				$( "#btn-continue" ).show();
			}
		} );
		$( "#btn-start" ).on( "click", function() {
			$( "#menu" ).slideToggle();
			g_sol.start( m_settings );
			activateGameScreen();
		} );
		$( "#btn-continue" ).on( "click", function () {
			$( "#menu" ).slideToggle();
			g_sol.continueGame( m_settings );
			activateGameScreen();
		} );
		$( "#btn-settings" ).on( "click", function () {
			$( "#menu-main" ).fadeTo( 300, 0 );
			$( "#menu-settings" ).slideToggle();
			$( "#select-draw" ).val( m_settings.draw );
			$( "#select-scoring" ).val( m_settings.scoring );
			$( "#select-speed" ).val( m_settings.speed );
		} );
		$( "#btn-ok" ).on( "click", function () {
			m_settings.draw = $( "#select-draw" ).val();
			m_settings.scoring = $( "#select-scoring" ).val();
			m_settings.speed = $( "#select-speed" ).val();
			$( "#menu-main" ).fadeTo( 500, 1 );
			$( "#menu-settings" ).slideToggle();
		} );
		$( "#btn-cancel" ).on( "click", function () {
			$( "#menu-main" ).fadeTo( 500, 1 );
			$( "#menu-settings" ).slideToggle();
		} );
		$( "#score-bar" ).on( "click", scoreBarClicked );
		$( document.body ).on( "mousedown", ":not(#score-bar)", scoreBarToggleOff );
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

	function activateGameScreen() {
		if( g_util.isMobile() ) {
			g_util.openFullscreen( document.body );
			if ( "orientation" in screen ) {
				screen.orientation.lock( "landscape-primary" );
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