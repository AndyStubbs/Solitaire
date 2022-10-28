let g_cards = ( function () {
	"use strict";

	const SUITS = [ "card-hearts", "card-clubs", "card-diamonds", "card-spades" ];
	const COLORS = [ "red", "black", "red", "black" ];
	
	return {
		"createDeck": createDeck,
		"getSuit": getSuit,
		"getValueClass": getValueClass,
		"getColor": getColor,
		"getNumber": getNumber
	};
	
	function createDeck( isShuffled ) {
		let deck = [];
		for( let i = 0; i < 52; i++ ) {
			deck.push( i );
		}
		if( isShuffled ) {
			return shuffleDeck( deck );
		}
		return deck;
	}

	function getSuit( value ) {
		return SUITS[ Math.floor( value / 13 ) ];
	}

	function getNumber( value ) {
		return ( value % 13 ) + 1;
	}

	function getValueClass( value ) {
		var number = getNumber( value );
		if( number === 1 ) {
			return "card-a";
		} else if( number === 11 ) {
			return "card-j";
		} else if( number === 12 ) {
			return "card-q";
		} else if( number === 13 ) {
			return "card-k";
		}

		return "card-" + number;
	}

	function getColor( value ) {
		return COLORS[ Math.floor( value / 13 ) ];
	}

	/*
 		Internal Functions
 	*/

	function shuffleDeck( deck ) {
		let temp = [];
		while( deck.length > 0 ) {
			let card = deck.splice( Math.floor( Math.random() * deck.length ), 1 );
			temp.push( card[ 0 ] );
		}
		return temp;
	}
	
} )();