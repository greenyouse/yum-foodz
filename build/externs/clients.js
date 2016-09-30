/**
 * @interface
 */
var clients = {};

/**
 * @return {!Promise<!Array<!ServiceWorkerClient>>}
 */
clients.matchAll = function() {};

/**
 * @param {string} url
 * @return {!Promise<!ServiceWorkerClient>}
 */
clients.openWindow = function(url) {};
