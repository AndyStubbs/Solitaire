/*
♠	&#9824;	&spades;	BLACK SPADE SUIT	
♣	&#9827;	&clubs;		BLACK CLUB SUIT	
♥	&#9829;	&hearts;	BLACK HEART SUIT	
♦	&#9830;	&diams;		BLACK DIAMOND SUIT
*/
let cards = ( function () {
	"use strict";

	const SUITS = [
		"Hearts", "Clubs", "Diamonds", "Spades"
	];
	const VALUES = [
		"A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
	];
	let logger = console.log;

	return {
		"createDeck": createDeck,
		"dealCard": dealCard,
		"dealCards": dealCards,
		"logDeck": logDeck,
		"validateDeck": validateDeck,
		"addLogger": addLogger
	};
	
	function createDeck() {
		let deck = [];
		for( let i = 0; i < 52; i++ ) {
			deck.push( createCard( i ) );
		}
		return shuffleDeck( deck );
	}
	
	function createCard( id ) {
		let suit = Math.floor( id / 13 );
		let color = [ "red", "black", "red", "black" ][ suit ];
		return {
			"id": id,
			"value": id % 13,
			"suit": suit.
			"color": color
		};
	}
	
	function dealCard( deck ) {
		return dealCards( deck, 1 );
	}
	
	function dealCards( deck, count = 1 ) {
		if( deck.length === 0 ) {
			return [];
		}
		if( deck.length < count ) {
			count = deck.length;
		}
		return deck.splice( deck.length - count - 1, count );
	}

	function shuffleDeck( deck ) {
		let temp = [];
		while( deck.length > 0 ) {
			let card = deck.splice( Math.floor( Math.random() * deck.length ), 1 );
			temp.push( card[ 0 ] );
		}
		return temp;
	}
	
	function logDeck( deck ) {
		for( let i = 0; i < deck.length; i++ ) {
			console.log( VALUES[ deck[ i ].value ] + " of " + SUITS[ deck[ i ].suit ] );
		}
	}
	
	function validateDeck( deck ) {
		if( deck.length < 52 ) {
			logger( "Invalid deck length: " + deck.length );
			return false;
		}
		let checks = {};
		for( let i = 0; i < deck.length; i++ ) {
			let card = deck[ i ];
			if( card.id === undefined || card.suit === undefined || card.value === undefined ) {
				logger( "Deck contains invalid card" );
				return false;
			}
			if( checks[ card.id ] ) {
				logger( "Duplicate card found: " + card.id );
				return false;
			}
			checks[ card.id ] = card;
			if( card.id < 0 || card.id >= 52 ) {
				logger( "Invalid card found: " + card.id );
				return false
			}
		}
		return true;
	}
	
	function addLogger( cmd ) {
		if( util.isFunction( cmd ) ) {
			logger = cmd;
		}
	}
} )();