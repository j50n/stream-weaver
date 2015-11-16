( function () {
	"use strict";

	/**
	 * Wraps the writable stream in a promise. The return value is `undefined`, as this
	 * is intended to be used to synchronize the stream with other code. Note that this
	 * function must be called prior to the stream finishing (usually on instantiation)
	 * or it will hang the process.
	 *
	 * @param {stream.Writable}stream A writable stream.
	 * @returns {Promise} Returns the value 'undefined'.
	 * @function writableStream2Promise
	 * @api public
	 */
	module.exports.writableStream2Promise = function writableStream2Promise( stream ) {
		return new Promise( function ( resolve, reject ) {
			stream.once( "finish", resolve );
			stream.once( "error", reject );
		} );
	};

	/**
	 * Wraps the readable stream in a promise. The return value is `undefined`, as this
	 * is intended to be used to synchronize the stream with other code. Note that this
	 * function must be called prior to the stream finishing (usually on instantiation)
	 * or it will hang the process.
	 *
	 * @param {stream.Readable}stream A Readable stream.
	 * @returns {Promise} Returns the value 'undefined'.
	 * @function readableStream2Promise
	 * @api public
	 */
	module.exports.readableStream2Promise = function readableStream2Promise( stream ) {
		return new Promise( function ( resolve, reject ) {
			stream.once( "end", resolve );
			stream.once( "error", reject );
		} );
	};
} )();