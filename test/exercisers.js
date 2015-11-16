/**
 * Exercisers for tests.
 * @module exercisers
 * @author Jason Smith
 */
( function () {
	"use strict";

	const foo = require( "foo-baz" );
	const utility = require( "../lib/utility.js" );
	const assert = require( "assert" );
	const stream = require( "stream" );
	const through2 = require( "through2" );

	/**
	 * Exercise an object transform-stream with an array of objects.
	 * Basically, shove some stuff in, get some stuff out.
	 * @function
	 * @param objects An array of objects (the "source").
	 * @param transforms The array of transform streams (in pipe order) to be exercised.
	 * @return {Promise} The array of returned objects (the "sink").
	 */
	const exerciseTransformStream = foo( function* exercise( objects, transforms ) {
		assert( Array.isArray( objects ),
			"objects: Should be an array of objects." );
		assert( Array.isArray( transforms ), "transforms: should be an array" );

		const objs = objects.slice();

		const results = [];

		const source = new stream.Readable( {
			objectMode: true,
			read: function () {
				if ( objs.length === 0 ) {
					this.push( null );
				}
				else {
					this.push( objs.shift() );
				}
			}
		} );

		const sink = through2.obj(
			function ( obj, _, next ) {
				results.push( obj );
				next();
			} );

		yield utility.writableStreamToPromise(
			transforms.reduce( function ( prev, current ) {
				return prev.pipe( current );
			}, source ).pipe( sink ) );

		return results;
	} );

	function sourceStream( buffers, objectMode ) {
		assert( Array.isArray( buffers ), "Buffers must be an array." );
		return new stream.Readable( {
			objectMode: !!objectMode,
			read: function () {
				if ( buffers.length === 0 ) {
					this.push( null );
				}
				else {
					this.push( buffers.shift() );
				}
			}
		} );
	}

	function sinkStream( objectMode ) {
		const sink = new stream.Writable( {
			objectMode: !!objectMode,
			write: function ( buffer, encoding, next ) {
				try {
					sink.data.push( buffer );
				}
				catch ( err ) {
					return next( err );
				}
				return next();
			}
		} );
		sink.data = [];
		return sink;
	}

	module.exports = {
		exerciseTransformStream: exerciseTransformStream,
		sourceStream: sourceStream,
		sinkStream: sinkStream
	};
} )();