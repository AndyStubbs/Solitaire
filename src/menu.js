let g_menu = ( function() {
	"use strict";

	let m_menu = {
		"status": "init",
		"state": "hidden"
	};

	let m_settings = null;
	let m_tableHtml = null;

	return {
		"init": init,
		"resize": resize,
		"getVegasStartScore": function () {
			return m_settings.vegasStartScore;
		},
		"setVegasStartScore": setVegasStartScore
	};

	function init() {
		initSettings();
		if( g_util.isMobile() && !g_util.isFullscreen() ) {
			$( "#btn-fullscreen" ).show();
		} else {
			$( "#btn-fullscreen" ).hide();
		}
		$( "#loading-overlay" ).fadeOut();
		g_sol.init();
		if( !g_sol.isGameInProgress() ) {
			$( "#btn-continue" ).hide();
		}
		$( "#menu" ).show();
		$( "#btn-menu" ).on( "click", function () {
			g_sol.pause();
			showMenu();
		} );
		$( "#btn-end-game" ).on( "click", function () {
			g_sol.endGame( false );
			showMenu();
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
		$( "#btn-fullscreen" ).on( "click", function () {
			activateGameScreen();
		} );
		$( "#btn-settings" ).on( "click", function () {
			$( "#menu-main" ).fadeTo( 300, 0 );
			$( "#menu-settings" ).slideToggle();
			updateSettingsForm();
		} );
		$( "#btn-stats" ).on( "click", function () {
			calcStats();
			$( "#menu-main" ).fadeTo( 300, 0 );
			$( "#menu-stats" ).slideToggle();
		} );
		$( "#btn-back" ).on( "click", function () {
			if( g_sol.isGameInProgress() ) {
				$( "#btn-continue" ).show();
			} else {
				$( "#btn-continue" ).hide();
			}
			$( "#menu-main" ).fadeTo( 500, 1 );
			$( "#menu-stats" ).slideToggle();
		} );
		$( "#btn-reset" ).on( "click", function () {
			if( confirm( "Are you sure you want to reset all your stats?" ) ) {
				g_sol.endGame( false );
				localStorage.removeItem( "gameStats" );
				$( "#menu-stats" ).fadeTo( 500, 0 );
				setTimeout( () => {
					$( "#menu-stats" ).fadeTo( 500, 1 );
					calcStats();
				}, 500 );
			}			
		} );
		$( "#btn-reset-vegas" ).on( "click", function () {
			if( g_sol.isGameInProgress() && g_sol.getScoreMode() === "Vegas" ) {
				g_sol.endGame( false );
			}
			setVegasStartScore( 0 );
			$( "#menu-stats" ).fadeTo( 500, 0 );
			setTimeout( () => {
				$( "#menu-stats" ).fadeTo( 500, 1 );
				calcStats();
			}, 500 );
		} );
		$( "#btn-ok" ).on( "click", function () {
			m_settings.draw = $( "#select-draw" ).val();
			m_settings.scoring = $( "#select-scoring" ).val();
			m_settings.speed = $( "#select-speed" ).val();
			saveSettings();
			$( "#menu-main" ).fadeTo( 500, 1 );
			$( "#menu-settings" ).slideToggle();
		} );
		$( "#btn-cancel" ).on( "click", function () {
			$( "#menu-main" ).fadeTo( 500, 1 );
			$( "#menu-settings" ).slideToggle();
		} );
		$( "#score-bar" ).on( "click", scoreBarClicked );
		$( document.body ).on( "mousedown", ":not(#score-bar)", scoreBarToggleOff );
		//document.addEventListener( "fullscreenchange", fullscreenchanged );
		setInterval( fullscreenchanged, 1000 );
	}

	function fullscreenchanged() {
		if( g_util.isFullscreen() ) {
			$( "btn-fullscreen" ).hide();
		} else {
			if( g_util.isMobile() ) {
				$( "btn-fullscreen" ).show();
			}
		}
	}

	function updateSettingsForm() {
		$( "#select-draw" ).val( m_settings.draw ).change();
		$( "#select-scoring" ).val( m_settings.scoring ).change();
		$( "#select-speed" ).val( m_settings.speed ).change();
	}

	function initSettings() {
		m_settings = JSON.parse( localStorage.getItem( "settings" ) );
		if( m_settings === null ) {
			m_settings = {
				"draw": "One",
				"scoring": "Standard",
				"speed": "Normal",
				"vegasStartScore": 0
			};
		}
	}

	function setVegasStartScore( score ) {
		m_settings.vegasStartScore = score;
		saveSettings();
	}

	function saveSettings() {
		localStorage.setItem( "settings", JSON.stringify( m_settings ) );
	}

	function showMenu() {
		g_sol.pause();
		$( "#game-over" ).hide();
		$( "#menu" ).slideToggle();
		if( g_sol.isGameInProgress() ) {
			$( "#btn-continue" ).show();
		} else {
			$( "#btn-continue" ).hide();
		}
	}

	function resize( height ) {
		if( height > 900 ) {
			m_menu.status = "default";
			$( "#score-toggle" ).hide();
			$( "#score-bar-placeholder" ).show();
			$( "#score-bar" ).css("top", 0 );
		} else {
			m_menu.status = "toggle";
			$( "#score-bar-placeholder" ).hide();
			if( m_menu.state === "hidden" ) {
				$( "#score-toggle" ).show();
				$( "#score-bar" ).css( "top", -$( ".score-row" ).height() );
			} else {
				$( "#score-toggle" ).hide();
				$( "#score-bar" ).css( "top", 0 );
			}
		}
	}

	function activateGameScreen() {
		if( g_util.isMobile() ) {
			g_util.openFullscreen( document.body );
			$( "#btn-fullscreen" ).hide();
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
				"top": -$( ".score-row" ).height()
			}, 500, function() {
				m_menu.state = "hidden";
			});
		}
	}

	function calcStats() {
		let gameStats = JSON.parse( localStorage.getItem( "gameStats" ) );
		if( gameStats === null ) {
			gameStats = [];
		}
		gameStats.sort( ( a, b ) => a.date - b.date );
		let stdGp = 0;
		let stdWin = 0;
		let stdBest = 0;
		let vegGp = 0;
		let vegWin = 0;
		let vegBest = -52;
		let vegPeak = -52;
		let vegCurrent = 0;
		let $window = $( window );
		let isMobile = $window.height() < 550 || $window.width() < 565;

		if( isMobile ) {
			$( ".stats-table" ).hide();
		} else {
			$( ".stats-table" ).show();
			buildTable( gameStats );
		}
		for( let i = 0; i < gameStats.length; i++ ) {
			let game = gameStats[ i ];
			if( game.mode === "Standard" ) {
				stdGp += 1;
				if( game.isWin ) {
					stdWin += 1;
				}
				if( game.score > stdBest ) {
					stdBest = game.score;
				}
			} else {
				vegGp += 1;
				if( game.isWin ) {
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
			if( !isMobile ) {
				buildTableRow( game );
			}
		}

		$( "#std-gp" ).text( stdGp );
		$( "#std-win" ).text( stdWin );
		$( "#std-best" ).text( stdBest );
		if( stdGp > 0 ) {
			$( "#std-pct" ).text( ( stdWin / stdGp * 100 ).toFixed( 0 ) + "%" );
		} else {
			$( "#std-pct" ).text( "0%" );
		}
		$( "#veg-gp" ).text( vegGp );
		$( "#veg-win" ).text( vegWin );
		$( "#veg-best" ).text( vegBest );
		$( "#veg-peak" ).text( vegPeak );
		if( g_sol.isGameInProgress() && g_sol.getScoreMode() === "Vegas" ) {
			$( "#veg-cur" ).text( g_sol.getScore() );
		} else {
			$( "#veg-cur" ).text( m_settings.vegasStartScore );
		}
		if( vegGp > 0 ) {
			$( "#veg-pct" ).text( ( vegWin / vegGp * 100 ).toFixed( 0 ) + "%" );
		} else {
			$( "#veg-pct" ).text( "0%" );
		}

		if( !isMobile && gameStats.length > 0 ) {
			$( "#tbl-stats" ).dataTable( {
	    		"paging": false,
				"searching": false,
				"scrollY": "200px",
				"autoWidth": false,
				"columns": [
    				{ "width": "90px" },
				   	null,
					null,
					null,
					null,
					null,
					null
				]
			} );
			setTimeout( function () {
				$($.fn.dataTable.tables(true)).DataTable().columns.adjust();
			}, 250 );
		}
	}

	function buildTable( gameStats ) {
		let $tableContainer = $( ".stats-table" );
		if( m_tableHtml === null ) {
			m_tableHtml = $tableContainer.html();
		} else {
			$tableContainer.html( m_tableHtml );
		}

		if( gameStats.length === 0 ) {
			$tableContainer.hide();
		} else {
			$tableContainer.show();
		}
	}

	function buildTableRow( game ) {
		let $tbody = $( "#tbl-stats tbody" );
		let $tr = $( "<tr>" );
		$tr.append( $( "<td>" ).append( g_util.formatDate( new Date( game.date ) ) ) );
		$tr.append( $( "<td>" ).append( game.mode ) );
		$tr.append( $( "<td>" ).append( game.draw ) );
		$tr.append( $( "<td>" ).append( game.score ) );
		$tr.append( $( "<td>" ).append( game.time.toFixed( 0 ) ) );
		$tr.append( $( "<td>" ).append( game.deckCount ) );
		let winText = "No";
		if( game.isWin ) {
			winText = "Yes";
		}
		$tr.append( $( "<td>" ).append( winText ) );
		$tbody.append( $tr );
	}
})();

$( window ).on( "load", function() {
	g_menu.init();
} );