/**
 * @const
 */
var caches = {};

/**
 * @param {string} cacheName
 * @return {Promise}
 */
caches.prototype.open = function(cacheName) {};

/**
 * @param {Request=} request
 * @param {Object=} options
 * @return {Promise<Array<Request>>}
 */
caches.prototype.keys = function(request, options) {};

/**
 * @param {Request} request
 * @return {Promise<Response>}
 */
caches.prototype.match = function(request) {};

/**
 * @const
 */
var cache = {};

/**
 * @param {Request} request
 * @return {Promise<void>}
 */
cache.prototype.add = function(request) {};

/**
 * @param {Array<Request>} requests
 * @return {Promise<void>}
 */
caches.prototype.addAll = function(requests) {};
