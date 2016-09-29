const bodyParser = require('body-parser'),
      compression = require('compression'),
      crypto = require('crypto'),
      debug = require('debug'),
      es6Renderer = require('express-es6-template-engine'),
      express = require('express'),
      fs = require('fs'),
      http = require('http'),
      jsonDB = require('node-json-db'),
      url = require('url'),
      webPush = require('web-push');

var app = express();
app.engine('html', es6Renderer);
app.set('views', 'dist');
app.set('view engine', 'html');
app.use(compression({level: 9}));
app.set('port', 5000);
app.use('*', wrapEtag);

var urlencodedParser = bodyParser.urlencoded({
  extended: false, type: 'application/x-www-form-urlencoded'});

var db = new jsonDB('recipesDB', true, false),
    fotdDB = new jsonDB('fotd', false, false);

// webPush.setGCMAPIKey(process.env.GCM_API_KEY);

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
 * Middleware for server side profile state mgmt. Uses a persistent cookie
 * and ETag as a fallback. A hard reset or private browsing will defeat this
 * (and cause you to lose the recipes). Didn't want to make an oauth login.
 *
 * @param {Object} req HTTP Request
 * @param {Object} res HTTP Response
 * @param {Function} next HTTP Response
 * @return {Function}
 */
function wrapEtag(req, res, next) {
  var etag = req.headers['if-none-match'],
      cookie = req.headers.cookie;

  if (cookie !== undefined) return next();

  var expiration = new Date('Jan 1 2030');
  if (etag !== undefined) {
    // NOTE: assumes /recipes is loaded initially to get identical entity
    // tag + no cache busting
    res.cookie('profile', etag, {expires: expiration, httpOnly: true});
    res.setHeader('ETag', etag);
  } else {
    var uuid = makeUUID(),
        hash = crypto.createHash('md5').update(uuid).digest('base64');
    res.cookie('profile', hash, {expires: expiration, httpOnly: true});
    res.setHeader('ETag', hash);
  }

  return next();
}

/**
 * fetches the recipes from the JSON database
 *
 * @param {string} profileId
 * @param {Function} cb
 * @return {Function}
 */
function fetchRecipes(profileId, cb) {
  try {
    var recipes = db.getData('/' + profileId);
    return cb(recipes);
  } catch (error) {
    return cb([]);
  }
}

// extension of : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
/**
 * Picks a random integer in the range of max (exclusive) and min (inclusive)
 * with defaults of 0 and 11.
 *
 * @param {Number=} max The max value
 * @param {Number=} min The min value
 * @return {Number}
 */
function randInt(max, min) {
  max = max || 11,
  min = min || 0;

  return Math.floor(Math.random() * (max - min) + min);
}

/** fotd recipe */
var dailyRecipe = {};
/** clients to send pushes to */
var subscribers = new Set();

/**
 * Sets the food of the day recipe
 */
function setFOTD() {
  var recipes = fotdDB.getData('/recipes'),
      max = recipes.length,
      index = randInt(max);

  dailyRecipe = recipes[index];
}

/**
 * Fire off the FOTD push message
 */
// TODO: not adding push notifications because of client-side space constraints
// yet to add: REST subscriptions endpoints, client-side subscribe button for
// browsers with service workers, SW push, msg nofitication, and subscription
// parts
// function sendNotification() {
//   var subscriptions = Array.from(subscribers);

//   if (subscriptions.length == 0) return;

//   // TODO: could change this part...
//   var title = "Yum Foodz",
//       messages = ["Awesome recipe incoming", "Check out your new recipe"],
//       index = randInt(messages.length),
//       message = messages[index],
//       payload = JSON.stringify({
//         "title": title,
//         "message": message
//       });

//   subscriptions.map(subscriber => {
//     var {endpoint, key, auth} = subscriber;

//     webPush.sendNotification(endpoint, {
//       TTL: 300,
//       payload: payload,
//       userPublicKey: key,
//       userAuth: auth
//     }).catch(error => {
//       debug('Push Error: ', error);
//     });

//   });
// }

setFOTD();
setInterval(setFOTD, 86400000); // delay of 1 day for daily changes

/**
 * Converts a asterisk delimited string of steps into an array
 *
 * @param {string} steps
 * @return {Array<string>}
 */
function formatSteps(steps) {
  // TODO: test here
  // console.log('steps', steps);
  steps = steps.split('*');
  if (steps[0] == '')
    steps = steps.slice(1);
  return steps.map(step => {
    return step.trim();
  });
}

/**
 * Creates a string with an asterisk for each step
 *
 * @param {Array<string>} steps
 */
function createSteps(steps) {
  return '* ' + steps.join('\n* ');
}

// two weeks for cache seems good, would do more if it was 100% stable
app.use(express.static(__dirname + '/dist', {"maxAge": 1209600000}));
// app.use(express.static(__dirname + '/templates', {"maxAge": 1}));

/*
 For routing I'm doing a strategy similar to what was laid out here in the server bits:
 https://medium.com/google-developers/instant-loading-web-apps-with-an-application-shell-architecture-7c0c2f10c73

 Load a full page template if there's no service worker support. Otherwise load the app-shell
 and load in the views as partial page templates (except for the initial page).
*/

// load the app-shell and redirect so the recipes view is loaded
app.get('/', (req, res) => {
  res.writeHead(302, {
    'Location': '/recipes'
  });

  res.end();
});


app.get('/recipes', (req, res) => {
  var profileId = req.headers.cookie;

  fetchRecipes(profileId, (recipes) => {

    return res.render('app-shell', {
      locals: {
        pageName: "Recipes",
        recipeList: recipes,
        headerBtn: "",
        stylesheets: ["css/recipes.css"],
        scripts: []
      },
      partials: {
        page: "dist/partial/recipes.html"
      }
    });
  });

});

// TODO: make a higher order fn to remove duplicate code
app.get('/recipe/:id', (req, res) => {
  var profileId = req.headers.cookie,
      recipeId = req.params.id;

  fetchRecipes(profileId, (recipes) => {
    var recipe = recipes.filter(r => { return r.id == recipeId; })[0];
    if (recipe) {

      return res.render('app-shell', {
        locals: {
          pageName: "Recipe",
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
          scripts: ["/js/recipe.js"],
          stylesheets: ["/css/recipe.css"]
        },
        partials: {
          page: "dist/partial/recipe.html"
        }
      });

    } else {
      // wimpy error handling
      return res.writeHead(404, {
        'Location': '/recipes'
      });

      res.end();
    }
  });

});

app.post('/recipe/:id', (req, res) => {
  var profileId = req.headers.cookie,
      recipeId = req.params.id;

  fetchRecipes(profileId, (recipes) => {
    var index;
    for (var i=0; i<recipes.length; i++) {
      if (recipes[i].id == recipeId)
        index = i;
    }

    db.delete('/' + profileId + '[' + index + ']');
    res.writeHead(302, {
      'Location': '/recipes'
    });
    res.end();
  });
});

app.get('/fotd', (req, res) => {
    var {id, picture, title,
         time, difficulty, description,
         ingredients, directions} = dailyRecipe;

  return res.render('app-shell', {
    locals: {
      pageName: "Food of the Day",
      id: id,
      picture: picture,
      title: title,
      time: time,
      difficulty: difficulty,
      description: description,
      ingredients: ingredients,
      directions: directions,
      actionBtn: 'add',
      headerBtn: '/recipes',
      scripts: ["/js/recipe.js"],
      stylesheets: ["/css/app-shell.css", "/css/recipe.css"]
    },
    partials: {
      page: "dist/partial/recipe.html"
    }
  });
});

app.get('/new-recipe', (req, res) => {
  var r = {
    id: 0,
    title: "",
    picture: "",
    title: "",
    time: "",
    difficulty: 0,
    description: "",
    ingredients: "",
    directions: ""
  };

  return res.render('app-shell', {
    locals: {
      pageName: "New Recipe",
      r: r,
      headerBtn: "",
      scripts: ["js/validate.js"],
      stylesheets: ["css/new-recipe.css"]
    },
    partials: {
      page: "dist/partial/new-recipe.html"
    }
  });
});

app.post('/new-recipe', urlencodedParser, (req, res) => {
  var newRecipe = req.body,
      profileId = req.headers.cookie;

  newRecipe.id= makeUUID();

  newRecipe.ingredients = formatSteps(newRecipe.ingredients);
  newRecipe.directions = formatSteps(newRecipe.directions);

  db.push('/' + profileId + '[]', newRecipe, true);

  // redirect back to recipes page
  res.writeHead(302, {
    'Location': '/recipes'
  });
  res.end();
});

app.get('/edit/:id', (req, res) => {
  var profileId = req.headers.cookie,
      recipeId = req.params.id,
      referer = req.headers.referer;

  fetchRecipes(profileId, (recipes) => {
    var recipe = recipes.filter(r => { return r.id == recipeId; })[0];
    if (recipe) {

      // copy the recipe record and operate on it, avoids state error
      var recipeCopy = JSON.parse(JSON.stringify(recipe));
      recipeCopy.ingredients = createSteps(recipeCopy.ingredients);
      recipeCopy.directions = createSteps(recipeCopy.directions);

      return res.render('app-shell', {
        locals:{
          pageName: "Edit Recipe",
          r: recipeCopy,
          headerBtn: referer,
          scripts: ["/js/validate.js"],
          stylesheets: ["/css/app-shell.css", "/css/new-recipe.css"]
        },
        partials: {
          page: "dist/partial/new-recipe.html"
        }
      });

    } else {
      // TODO: wimpy error handling should do sitewide 404
      return res.writeHead(404, {
        'Location': '/recipes'
      });
    }
  });
});

app.post('/edit/:id', urlencodedParser, (req, res) => {
  var newRecipe = req.body,
      profileId = req.headers.cookie,
      recipeId = req.params.id;

  newRecipe.id = recipeId;

  fetchRecipes(profileId, (recipes) => {
    var index;
    for (var i=0; i<recipes.length; i++) {
      if (recipes[i].id == recipeId)
        index = i;
    }

    newRecipe.ingredients = formatSteps(newRecipe.ingredients);
    newRecipe.directions = formatSteps(newRecipe.directions);

    db.push('/' + profileId + "[" + index + "]", newRecipe, true);
    // redirect back to recipes page
    res.writeHead(302, {
      'Location': '/recipes'
    });
    res.end();
  });
});

app.post('/sync', (req, res) => {
  var recipes = req.body,
      profileId = req.headers.cookie;

  // merge recipe data for the profile
  db.push('/' + profileId, recipes, false);
});

var server = http.createServer(app).listen(app.get('port'), function() {
  console.log('Started server on port ' + app.get('port'));
});
