( function () {
	"use strict";

	const assert = require( "assert" );
	const Writable = require( "stream" ).Writable;
	const Readable = require( "stream" ).Readable;
	const foo = require( "foo-baz" );
	const through2 = require( "through2" );
	const utility = require( "./utility" );

	function lineStream() {
		let overrun = [];

		function findLastLF( buffer ) {
			let pos = buffer.indexOf( "\n" );
			if ( pos < 0 ) {
				return pos;
			}
			for ( ;; ) {
				const nextPos = buffer.indexOf( "\n", pos + 1 );
				if ( nextPos > 0 ) {
					pos = nextPos;
				}
				else {
					return pos;
				}
			}
		}

		return through2( function each( buffer, _, next ) {
				const self = this;
				try {
					const pos = findLastLF( buffer );
					if ( pos === -1 ) {
						overrun.push( buffer );
					}
					else {
						overrun.forEach( function ( buffer ) {
							self.push( buffer );
						} );
						overrun = [];

						self.push( buffer.slice( 0, pos + 1 ) );
						overrun.push( buffer.slice( pos + 1 ) );
					}
				}
				catch ( err ) {
					return next( err );
				}
				return next();
			},
			function flush( done ) {
				const self = this;
				try {
					let lastByte = new Buffer( 0 );
					overrun.forEach( function ( buffer ) {
						self.push( buffer );
						if ( buffer.length > 0 ) {
							lastByte = buffer.slice( buffer.length - 1 );
						}
					} );

					/*
					 * Ensure the last byte is a LF.
					 * If the lastByte is empty, there was no overflow, so the last byte from "each" was a LF.
					 * If the lastByte is over 127 (into the UTF-8 multibyte range) or the lastByte converted
					 *    to a string is not a LF, then we need to add a LF.
					 */
					if ( lastByte.length !== 0 && ( lastByte[ 0 ] >= 127 || lastByte.toString() !== "\n" ) ) {
						self.push( "\n" );
					}
				}
				catch ( err ) {
					return done( err );
				}
				return done();
			} );
	}

	function bufferedOutputStream(size){
		let buffers = [];
		let byteCount = 0;

		function flushBuffers(stream){
			if(byteCount > 0) {
				stream.push(Buffer.concat(buffers, byteCount));
				buffers = [];
				byteCount = 0;
			}
		}
		return through2(function each(buffer,_,next){
			try {
				buffers.push(buffer);
				byteCount  += buffer.length;
				if(byteCount >= size){
					flushBuffers(this);
				}
			} catch(err){
				return next(err);
			}
				return next();
		},
		function flush(done){
			try{
				flushBuffers(this);
			}catch(err){
				return done(err);
			}
			return done();
		});
	}

	module.exports = foo( function* multiplexer( inputs, output ) {
		assert( Array.isArray( inputs ), "Inputs must be an array." );
		assert( inputs.length > 0, "There must be at least one input stream." );

		//assert( output instanceof Writable, "Output stream is not a Writable." );
		inputs.forEach( function ( input, index ) {
			assert( input instanceof Readable, `Input stream #${index} is not a Readable.` );
		} );

		const bufferStream = bufferedOutputStream(65536);
		const inputPromises = [];
		inputs.forEach( function ( input ) {
			const stream = lineStream();
			input.pipe( stream );
			inputPromises.push( utility.writableStream2Promise( stream ) );
			stream.pipe( bufferStream, {
				end: false
			} );
		} );
		const pBuffer = utility.writableStream2Promise( bufferStream );
		bufferStream.pipe(output);

		yield Promise.all( inputPromises );
		bufferStream.end();

		yield pBuffer;

		return output;
	} );
} )();