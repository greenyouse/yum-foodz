// cache busting is done by upgrading the cache version
var staticCache = 'foodz-cache-v3',
    imgCache = 'foodz-imgs-cache-v1',
    CURRENT_CACHES = [
      staticCache,
      imgCache
    ];

var staticPrecache = [
  '/app-shell.html',
  '/css/app-shell.css',
  '/css/new-recipe.css',
  '/css/noscript.css',
  '/css/recipe.css',
  '/css/recipes.css',
  '/css/settings.css',
  '/js/app.js',
  '/js/recipe.js',
  '/js/validate.js',
  '/js/push.js',
  '/partial/new-recipe.html',
  '/partial/recipe.html',
  '/partial/recipes.html',
  '/partial/settings.html',
  '/images/pencil.svg',
  '/icons/favicon.ico'
];

var sw = {};

/**
 * The install event, adds precache files to the static cache
 *
 * @param {Event} event The install event
 */
self.oninstall = function(event) {
  event.waitUntil(
    caches.open(staticCache).then(function(cache) {
      return cache.addAll(staticPrecache);
    }).then(function() {
      return self.skipWaiting();
    })
  );
};

/**
 * Handles the activation event, sets up the caches
 *
 * @param {Event} event The activation event
 */
self.onactivate = function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          // apps usually have a prefixed cache name
          if (CURRENT_CACHES.includes(cacheName)) {
            return cacheName;
          } else {
            return caches.delete(cacheName);
          }})
      ).then(function() {
        // get the database set up
        database.init().then(function() {
          // console.log('database loaded!');
          // sync back changes that were made offline
          // avoiding the queued backlog technique for simplicity
          sw.syncToServer();
        });
      }).then(function() {
        self.clients.claim();
      }).catch(function(err) {
        console.error(err);
      });
    })
  );
};

/**
 * Send recipes back to the server
 * @param {Object=} record An optional recipe record from the database to sync
 * @return {Promise}
 */
sw.syncToServer = function(record) {
  return new Promise(function() {
    if (navigator.online) {
      if (record) {
        fetch('/sync', {
          method: 'POST',
          body: record
        });
      } else {
        database.getAll(function(records) {
          fetch('/sync', {
            method: 'POST',
            body: records
          });
        });
      }
    }
  });
};

/**
 * Render a string literal template
 *
 * @param {string} templatePath The path of the template
 * @param {Object} optionsDict An object with templating options
 * @return {string}
 */
sw.renderTemplate = function(templatePath, optionsDict) {
  return template.render(templatePath, optionsDict).then(function(page) {
    return new Response(page, {
      'headers': {
        'Content-Type': 'text/html'
      }
    });
  }).catch(function(error) {
    console.error('renderTemplate error', error);
  });
};

/**
 * Does text formatting for steps + ingredients
 *
 * @param {string} steps The steps or ingredients
 * @return {Array<string>}
 */
sw.formatSteps = function(steps) {
  steps = steps.split('*');
  if (steps[0] == '')
    steps = steps.slice(1);
  return steps.map(step => {
    return step.trim();
  });
};

/**
 * Formats the text with asterisks for each step
 *
 * @param {Array<string>} steps
 * @return {string}
 */
sw.createSteps = function(steps) {
  return '* ' + steps.join('\n* ');
};

// TODO: should make a more generic way of doing this so it's resuable
/**
 * Fill in templates matching server-side endpoints
 *
 * @param {Request} request
 * @param {string} path
 * @return {!string}
 */
sw.matchEndpoint = function(request, path) {
  var referrer = request.referrer || '/recipes';

  return new Promise(function(success) {
    if (path.match(/(\/|\/recipes)$/)) {
      return database.getAll().then(function(recipes) {
        var renderOpts = {
          locals: {
            pageName: 'Recipes',
            recipeList: recipes,
            headerBtn: '',
            stylesheets: ['css/recipes.css'],
            scripts: []
          },
          partials: {
            page: '/partial/recipes.html'
          }
        };

        return sw.renderTemplate('/app-shell.html', renderOpts).then(page => {
          return success(page);
        });
      });

    } else if (path.match(/\/recipe\/.*/)) {
      let recipeId = path.substr(8);

      return database.get(recipeId).then(function(recipe) {
        var renderOpts = {
          locals: {
            pageName: 'Recipe',
            id: recipe.id,
            picture: recipe.picture,
            title: recipe.title,
            time: recipe.time,
            difficulty: recipe.difficulty,
            description: recipe.description,
            ingredients: recipe.ingredients,
            directions: recipe.directions,
            actionBtn: 'edit',
            headerBtn: '/recipes',
            scripts: ['/js/recipe.js'],
            stylesheets: ['/css/app-shell.css', '/css/recipe.css']
          },
          partials: {
            page: '/partial/recipe.html'
          }
        };

        return sw.renderTemplate('/app-shell.html', renderOpts)
          .then(function(page) {
          return success(page);
        });
      });

    } else if (path.match(/\/(new-recipe$)/)) {
      var r = {
        id: 0,
        title: '',
        picture: '',
        time: '',
        difficulty: 0,
        description: '',
        ingredients: '',
        directions: ''
      },

      renderOpts = {
        locals: {
          pageName: 'New Recipe',
          r: r,
          headerBtn: '',
          scripts: ['js/validate.js'],
          stylesheets: ['css/new-recipe.css']
        },
        partials: {
          page: '/partial/new-recipe.html'
        }
      };

      return sw.renderTemplate('/app-shell.html', renderOpts)
        .then(function(page) {
          return success(page);
        });

    } else if (path.match(/\/edit\/.*/)) {
      let recipeId = path.substr(6);

      return database.get(recipeId).then(function(recipe) {

        var recipeCopy = JSON.parse(JSON.stringify(recipe));
        recipeCopy.id = recipeId;
        recipeCopy.ingredients = sw.createSteps(recipeCopy.ingredients);
        recipeCopy.directions = sw.createSteps(recipeCopy.directions);

        var renderOpts = {
          locals:{
            pageName: "Edit Recipe",
            r: recipeCopy,
            headerBtn: referrer,
            scripts: ["/js/validate.js"],
            stylesheets: ["/css/app-shell.css", "/css/new-recipe.css"]
          },
          partials: {
            page: "/partial/new-recipe.html"
          }
        };

        return sw.renderTemplate('/app-shell.html', renderOpts)
          .then(function(page) {
            return success(page);
          });
      });

    }
    else {
      return success(undefined);
    }
  });
};

/**
 * Serves static resources out of the cache
 *
 * @param {Request} request A fetch request
 * @param {string} cacheName The relevant cache to search
 * @param {string} path A url pathname for the request
 * @return {string}
 */
sw.serveStatic = function(request, cacheName, path) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(response) {
      return response ||
        sw.matchEndpoint(request, path).then(function(page) {
          var headers = new Headers();

          return page || fetch(request).then(response => {
            return response;
          });
      });
    });
  }).catch(function(err) {
    console.error('SW fetch error', err);
  });
};

/**
 * Generates a UUID
 * @return {string}
 */
function makeUUID() {
  // from: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Reads a x-www-form-encoded body from a request
 *
 * @param {Request} request The request to read
 * @return {Promise}
 */
sw.readFormBody = function(request) {
  return request.text().then(function(data) {
    var formMap = {};

    data.split('&').reduce((acc, pair) => {
      let [name, val] = pair.split('='),
          sanitized = decodeURIComponent(val);

      if (name != 'picture') {
        let plus = sanitized.replace(/\+/g, ' '),
            newLines = plus.replace(/%0D%0A/g, '');
        sanitized= newLines.replace(/%3A/g, ':');
      }

      acc[name] = sanitized;
      return acc;
    }, formMap);

    return formMap;
  });
};

/**
 * Handles any post requests by adding the data to client-side storage and
 * redirecting to the next page.
 *
 * @param {Request} request A fetch request
 * @return {Promise}
 */
sw.postRequest = function(request) {
  var url = request.url;

  if (url.match(/\/new-recipe/)) {
    return sw.readFormBody(request).then(function(newRecipe) {

      // console.log('recipe', newRecipe);
      newRecipe.id = makeUUID();
      newRecipe.ingredients = sw.formatSteps(newRecipe.ingredients);
      newRecipe.directions = sw.formatSteps(newRecipe.directions);
      return database.add(newRecipe).then(() => {
        return Response.redirect('/recipes', 302);
      });
    });

  } else if (url.match(/\/edit\/.*/)) {
    var recipeId = url.split(/edit\//)[1];

    return sw.readFormBody(request).then(function(recipe) {

      recipe.id = recipeId;
      recipe.ingredients = sw.formatSteps(recipe.ingredients);
      recipe.directions = sw.formatSteps(recipe.directions);
      return database.update(recipe).then(() => {
        return Response.redirect('/recipes', 302);
      });
    });
  } else if (url.match(/\/recipe\/.*/)) {
    let url = new URL(request.url),
        recipeId = url.pathname.substr(8);

    return database.delete(recipeId).then(() => {
      return Response.redirect('/recipes', 302);
    });
  }
};

// GET - fetch cached page
// POST - insert new data into localStorage + add to server event queue
// - when online sync the clientside state back to the server
// - If there's a pic from a 3rd party site cache it in the imgs cache + use
// no-cors for the fetch
/**
 * Redirects the fetch based on the request's url
 *
 * @param {Event} event Fetch event
 */
self.onfetch = function(event) {
  var request = event.request;

  if (request.method === 'GET') {
    var url = new URL(request.url);

    if (url.origin === location.origin) {
      event.respondWith(sw.serveStatic(request, staticCache, url.pathname));
    } else {
      // when not to our origin it's a 3rd party img request
      event.respondWith(sw.serveStatic(request, imgCache, ''));
    }
  } else if (request.method === 'POST') {
    // return sw.postRequest(request);
    event.respondWith(sw.postRequest(request));
  }
};

/**
 * Gets a random title from the titles array
 *
 * @return {string}
 */
sw.getMessage = function() {
  var messages = ["Awesome recipe incoming", "Check out your new recipe"],
      index = Math.floor(Math.random() * messages.length);

  return messages[index];
};

self.addEventListener('push', function(event) {
  // console.log('push', event);
  var title = 'Yum Foodz',
      msg = sw.getMessage();
  event.waitUntil(
    self.registration.showNotification(title, {
      body: msg,
      icon: 'icons/favicon-32x32.png',
      vibrate: [100, 200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  // console.log('click', event);
  event.notification.close();
  event.waitUntil(
    clients.matchAll()
      .then(function(windowClients) {
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url.match(/\/fotd/) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/fotd');
        }
      })
  );
});


//////////////////////////////////////////////////////////////////
// Section for templating
var template = {};

// adapted version of https://github.com/dondido/express-es6-template-engine
/**
 * The content is a template literal that is filled in by keyList and valList
 *
 * @param {string} content The template literal to render
 * @param {Array<string>} keyList Keys to match against
 * @param {Array<string>} valList Values to put into template
 * @return {string}
 */
template.interpolate = (content, keyList, valList) => new Function(
    ...keyList,
  'return `' + content + '`;'
)(...valList);

/**
 * Reads a template from partial out of the cache or network
 *
 * @param {string} filePath Name of the template
 * @return {!string}
 */
template.readPartial = function(filePath) {
  return new Promise(success => {
    caches.open(staticCache).then(cache => {
      return cache.match(filePath).then(response => {
        return response || fetch(filePath);
      }).then(resp => {
        return resp.text().then(text => {
          return success(text);
        });
      });
    }).catch(err => {
      console.error('readPartial error', err);
    });
  });
};

/**
 * Renders a template or template string
 *
 * @param {string} content Template content to transform
 * @param {Object} dict Object with keys to transform the template with
 * @return {Function|string}
 */
template.render = function(filePath, dict) {
  return new Promise((callback) => {
    // read in locals
    var keys = [],
        vals = Object.keys(dict.locals).map(local => {
          keys.push(local);
          return (dict.locals[local]);
        }),
        partialKeys = Object.keys(dict.partials);

    keys = keys.concat(partialKeys);
    // read all the subpages
    return Promise.all(partialKeys.map(partial => {
      return template.readPartial(dict.partials[partial]);
    })).then(subpages => {
      var subpageVals = vals.concat(subpages);
      // render the subpages first
      vals = vals.concat(
        subpages.map(subpage => template.interpolate(subpage, keys, subpageVals))
      );

      // then render the parent page
      return template.readPartial(filePath).then(content => {
        var rendered = template.interpolate(content, keys, vals);
        return callback(rendered);
      });
    });
  });
};


//////////////////////////////////////////////////////////////////
// Section for database

var database = {};

/**
 * Load IndexedDB
 */
database.init = function() {
  return new Promise(function(success) {
    if (!self.db) {
      var req = indexedDB.open("foodz-db");

      // just bubble errors to save space (handles all db errors)
      req.onerror = function(event) {
        console.error('db error', event.target.errorCode);
      };

      req.onsuccess = function() {
        self.db = req.result;
        success(self.db);
      };

      req.onupgradeneeded = function(event) {
        var db = event.target.result;
        var objectStore = db.createObjectStore('recipes', {keyPath: 'id'});

        objectStore.createIndex('id', 'id', {unique: true});
      };
    }
  });
};

// just squishing these for space (should come out differently when compiled)
/**
 * Get a recipe from the database
 *
 * @param {string} recipeId A recipe id to search with
 * @param {Function} callback A success callback to pass results to
 * @return {Promise}
 */
database.get = function(recipeId) {
  return new Promise(function(success) {
    self.db.transaction(['recipes']).objectStore('recipes').get(recipeId).onsuccess = function(event) {
      success(event.target.result);
    };
  });
};

/**
 * Adds a recipe to the database
 *
 * @param {string} recipe A recipe to add
 * @param {Function} callback A success callback to pass results to
 */
database.add = function(recipe) {
  return new Promise(function(success) {
    self.db.transaction(['recipes'], 'readwrite').objectStore('recipes').add(recipe).onsuccess = function(event) {
      success(event.target.result);
    };
  });
};

/**
 * Updates a recipe in the database
 *
 * @param {string} recipe A recipe to update
 * @param {Function} callback A success callback to pass results to
 */
database.update = function(recipe) {
  return new Promise(function(success) {
    self.db.transaction(['recipes'], 'readwrite').objectStore('recipes').put(recipe).onsuccess = function(event) {
      success(event.target.result);
    };
  });
};

/**
 * Retrieves all the records from IndexedDB
 *
 * @param {Function} success A success callback to pass results to
 * @return {Promise}
 */
database.getAll = function() {
  var records = [];
  return new Promise(function(callback) {
    self.db.transaction(['recipes']).objectStore('recipes').index('id').openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        records.push(cursor.value);
        cursor.continue();
      } else {
        callback(records);
      }
    };
  });
};

/**
 * Delete a recipe
 *
 * @param {string} recipeId A recipe id to search with
 * @return {Promise}
 */
database.delete = function(recipeId) {
  return new Promise(function(success) {
    self.db.transaction(['recipes'], 'readwrite').objectStore('recipes').delete(recipeId).onsuccess = function(event) {
      success(event.target.result);
    };
  });
};
