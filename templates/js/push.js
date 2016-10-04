// TODO: clean pushBtn/pushLabel parts, try to pass them around more

var push = {};
/** @type {string} */
push.subscribeText = 'Enable Push'; // easier to modify the msg this way
/** @type {string} */
push.unsubscribeText = 'Disable Push';

/**
 * Toggle the ServiceWorker push subscription
 *
 */
push.toggleSubscription = function() {
  var pushBtn = document.getElementById('pushBtn');
  pushBtn.checked ? push.unsubscribe() : push.subscribe();
};

/**
 * Toggle the server subscription for push notifications
 *
 * @param {PushSubscription} subscription The push subscription
 * @param {string} action Either subscribe or unsubscribe
 */
push.toggleServerSubscription = function(subscription, action) {

  var pushBtn = document.getElementById('pushBtn'),
      pushLabel = document.querySelector('#pushBtn ~ label');

  var msg = JSON.stringify(subscription),
      headers = {'Content-Type': 'application/json'};

  if (action == 'subscribe') {
    pushBtn.setAttribute('checked', true);
    pushLabel.textContent = push.unsubscribeText;

    fetch('/subscription', {
      method: 'PUT',
      headers: headers,
      body: msg
    });
  } else {
    pushBtn.removeAttribute('checked');
    pushLabel.textContent = push.subscribeText;

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
      pushLabel = document.querySelector('#pushBtn ~ label');

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
          pushLabel = document.querySelector('#pushBtn ~ label');

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
    var appHeader = document.getElementsByTagName('header')[0],
        /** @type {Element} */
        br = document.createElement('br'),
        /** @type {Element} */
        div = document.createElement('div');

    div.innerHTML = '<input type="checkbox" id="pushBtn"><label>' + push.subscribeText + '</label>';
    appHeader.appendChild(br);
    appHeader.appendChild(div);

    var pushBtn = document.getElementById('pushBtn'),
        pushLabel = document.querySelector('#pushBtn ~ label');

    // set up a button event listener
    pushLabel.addEventListener('click', push.toggleSubscription);
    pushLabel.addEventListener('touchend', push.toggleSubscription);

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
  }
}();
