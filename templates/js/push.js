// TODO: clean pushBtn/pushLabel parts, try to pass them around more

var push = {};
/** @type {string} */
push.subscribeText = 'Show Notifications'; // easier to modify the msg this way
/** @type {string} */
push.unsubscribeText = 'Disable Notifications';

/**
 * Toggle the ServiceWorker push subscription
 *
 */
push.toggleSubscription = function() {
  var pushBtn = document.getElementById('pushBtn'),
      pressed = pushBtn.getAttribute('aria-pressed');

  console.log('pressed', pressed);
  pressed == "true" ? push.unsubscribe() : push.subscribe();
};

/**
 * Toggle the server subscription for push notifications
 *
 * @param {PushSubscription} subscription The push subscription
 * @param {string} action Either subscribe or unsubscribe
 */
push.toggleServerSubscription = function(subscription, action) {
  console.log(action);

  var pushBtn = document.getElementById('pushBtn'),
      pushLabel = document.getElementById('pushLabel');

  var msg = JSON.stringify(subscription),
      headers = {'Content-Type': 'application/json'};

  if (action == 'subscribe') {
    fetch('/subscription', {
      method: 'PUT',
      headers: headers,
      body: msg
    });
  } else {
    fetch('/subscription', {
      method: 'DELETE',
      headers: headers,
      body: msg
    });
  }
};
/**
 * Subscribes the ServiceWorker to push notifications
 */
push.subscribe = function() {
  var pushBtn = document.getElementById('pushBtn'),
      pushLabel = document.getElementById('pushLabel');

  pushBtn.setAttribute('aria-pressed', true);
  pushLabel.textContent = push.unsubscribeText;

  navigator.serviceWorker.ready.then(function(registration) {
    registration.pushManager.subscribe({userVisibleOnly: true})
      .then(function(subscription) {
        push.toggleServerSubscription(subscription, 'subscribe');
      }).catch(function(error) {
        console.error('subscription error: ', error);
        pushLabel.textContent = push.subscribeText;
      });
  });
};

/**
 * Unsubscribe the ServiceWorker from push notifications
 */
push.unsubscribe = function() {
  navigator.serviceWorker.ready.then(function(registration) {
    registration.pushManager.getSubscription().then(function(subscription) {
      var id = subscription.subscriptionId,
          pushBtn = document.getElementById('pushBtn'),
          pushLabel = document.getElementById('pushLabel');

      pushBtn.setAttribute('aria-pressed', false);
      pushLabel.textContent = push.subscribeText;

      console.log('sub', subscription);
      push.toggleServerSubscription(subscription, 'unsubscribe');

      subscription.unsubscribe().then(function() {
        pushLabel.textContent = push.subscribeText;
      }).catch(function(error) {
        console.error('unsubscribe error: ', error);
      });
    });
  });
};

/**
 * Set up push notifications if ServiceWorker exists
 */
push.init = function() {
  if ('serviceWorker' in navigator &&
     Notification.permission !== 'denied' &&
      'PushManager' in window) {

    // add the button for push subscriptions when SW is available
    /** @type {Element} */
    var settingsPane = document.getElementById('settingsPane'),
        /** @type {Element} */
        br = document.createElement('br'),
        /** @type {Element} */
        article = document.createElement('article');

    article.innerHTML = `<div id="pushBtn" tabindex="0" role="button" aria-pressed="false" aria-describeby="pushLabel"></div>
      <p id="pushLabel">${push.subscribeText}</p>`;

    settingsPane.appendChild(br);
    settingsPane.appendChild(article);

    var pushBtn = document.getElementById('pushBtn'),
        pushLabel = document.getElementById('pushLabel');

    // set up button event listeners
    // chrome handles click delay on mobile now (FF and Opera?)
    pushBtn.addEventListener('click', push.toggleSubscription);
    pushBtn.addEventListener('keydown', function(event) {
      if (event.key == 'Enter')
        push.toggleSubscription();
    });

    // push subscription initialization
    navigator.serviceWorker.ready.then(function(registration) {
      registration.pushManager.getSubscription().then(function(subscription) {
        if (!subscription) {

          // set the button text
          pushLabel.content = push.subscribeText;

        } else {
          push.toggleSubscription();
        }
      });
    });
  } else {
    /** @type {Element} */
    var settingsPane = document.getElementById('settingsPane'),
        /** @type {Element} */
        br = document.createElement('br'),
        /** @type {Element} */
        text = document.createElement('h3');

    // TODO: should probly think of a better display here, ugly
    text.textContent = 'No service worker detected, no settings to add';
    text.setAttribute('id', 'settingsFallback');
    settingsPane.appendChild(br);
    settingsPane.appendChild(text);
  }
}();
