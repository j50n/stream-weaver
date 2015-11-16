( function () {
	"use strict";

	const test = require( "duct-tape" );
	const foo = require( "foo-baz" );
	const source = require( "./exercisers.js" ).sourceStream;
	const sink = require( "./exercisers.js" ).sinkStream;

	const multiplexer = require( ".." ).multiplexer;

	test( "Single stream.", foo( function* blah( t ) {
		const r1 = source( [ "The quick brown fox\njumped", " over ", "the lazy", "\nyellow dog." ] );
		const s = sink();

		const pm = multiplexer( [ r1 ], s );

		yield pm;

		t.equal( s.data.map( function ( buffer ) {
				return buffer.toString();
			} ).join( "" ),
			"The quick brown fox\njumped over the lazy\nyellow dog.\n",
			"A single input stream should come out unchanged, but with a trailing LF." );
	} ) );

	test( "Try some complex data.", foo( function* blah( t ) {
		const r1 = source( [ "hel", "lo ", "worl", "d.\nHello baz." ] );
		const r2 = source( [ "elephant\n", "gir", "affe\nwhal", "e" ] );
		const r3 = source( [ "abc\ndef\nghi\njkl\n.\n" ] );
		const s = sink();

		const pm = multiplexer( [ r1, r2, r3 ], s );

		yield pm;

		t.equal( s.data.map( function ( buffer ) {
				return buffer.toString();
			} ).join( "" ),
			"hello world.\nelephant\ngiraffe\nabc\ndef\nghi\njkl\n.\nHello baz.\nwhale\n",
			"Expected a specific output." );
	} ) );

} )();