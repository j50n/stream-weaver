#!/bin/bash
 //bin/false; exec node "$0" "$@"
require( "foo-baz" )( function* swMux() {
	"use strict";

	const fs = require( "fs" );
	const multiplexer = require( "." ).multiplexer;

	const args = require( "nomnom" )
		.script( "sw-mux" )
		.help( "Multiplex line delimited inputs into a single output stream." )
		.nom();

	const inputs = args._.map( function ( filePath ) {
		return fs.createReadStream( filePath );
	} ).concat( process.stdin );
	//console.error( inputs );

	yield multiplexer(
		inputs, process.stdout );
} )().catch( function ( err ) {
	"use strict";
	console.error( err.stack );
	process.exit( 1 );
} );