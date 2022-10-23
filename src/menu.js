$( document ).ready( function() {
	$( "#menu" ).show();
	$( "#btn-start" ).on( "click", function() {
		$( "#menu" ).hide();
		//Sol.start();
		if ( g_util.isMobile() ) {
			g_util.openFullscreen( document.body );
			if ( "orientation" in screen ) {
				screen.orientation.lock( "landscape-primary" );
			}
		}
	});
});