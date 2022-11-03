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
			$( "#game-over" ).hide();
			$( "#menu" ).slideToggle();
			if( g_sol.isGameInProgress() ) {
				$( "#btn-continue" ).show();
			} else {
				$( "#btn-continue" ).hide();
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
		$( "#btn-stats" ).on( "click", function () {
			calcStats();
			$( "#menu-main" ).fadeTo( 300, 0 );
			$( "#menu-stats" ).slideToggle();
		} );
		$( "#btn-back" ).on( "click", function () {
			$( "#menu-main" ).fadeTo( 500, 1 );
			$( "#menu-stats" ).slideToggle();
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

	function calcStats() {
		let gameStats = JSON.parse( localStorage.getItem( "gameStats" ) );
		/*
  			gameStats.push( {
			"date": ( new Date() ).getTime,
			"mode": m_scoreMode,
			"score": score,
			"time": elapsed,
			"deckCount": m_deckCount,
			"isWin": isWin,
			//"cards": m_undoStack[ 0 ]
		} );
  		*/
		gameStats.sort( ( a, b ) => a.date - b.date );
		let stdGp = 0;
		let stdWin = 0;
		let stdBest = 0;
		let vegGp = 0;
		let vegWin = 0;
		let vegBest = 0;
		let vegPeak = -9999;
		let vegCurrent = 0;
		let $tbody = $( "#tbl-stats tbody" );
		$tbody.html( "" );
		for( let i = 0; i < gameStats.length; i++ ) {
			let game = gameStats[ i ];
			if( game.mode === "Standard" ) {
				stdGp += 1;
				if( game.win ) {
					stdWin += 1;
				}
				if( game.score > stdBest ) {
					stdBest = game.score;
				}
			} else {
				vegGp += 1;
				if( game.win ) {
					vegWin += 1;
				}
				if( game.score > vegBest ) {
					vegBest = game.score;
				}
				vegCurrent += game.score;
				if( vegCurrent > vegPeak ) {
					vegPeak = vegCurrent;
				}
			}
			let $tr = $( "<tr>" );
			$tr.append( $( "<td>" ).append( g_util.formatDate( new Date( game.date ) ) ) );
			$tr.append( $( "<td>" ).append( game.mode ) );
			$tr.append( $( "<td>" ).append( game.score ) );
			$tr.append( $( "<td>" ).append( game.elapsed ) );
			$tr.append( $( "<td>" ).append( game.deckCount ) );
			$tr.append( $( "<td>" ).append( game.isWin ) );
			$tbody.append( $tr );
		}

		$( "#std-gp" ).text( stdGp );
		$( "#std-win" ).text( stdWin );
		$( "#std-best" ).text( stdBest );
		if( stdGp > 0 ) {
			$( "#std-pct" ).text( stdWin / stdGp + "%" );
		} else {
			$( "#std-pct" ).text( "" );
		}
		$( "#veg-gp" ).text( vegGp );
		$( "#veg-win" ).text( vegWin );
		$( "#veg-best" ).text( vegBest );
		$( "#veg-peak" ).text( vegPeak );
		$( "#veg-cur" ).text( vegCurrent );
		if( vegGp > 0 ) {
			$( "#veg-pct" ).text( vegWin / vegGp + "%" );
		} else {
			$( "#veg-pct" ).text( "" );
		}
	}
})();

$( window ).on( "load", function() {
	g_menu.init();
} );