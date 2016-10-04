/* basic sw registration

 I'm currently requesting the whole page instead of using XHR for the page
 inside the app-shell. To avoid registering a new SW every time, I put in
 a check that will block new SW registration if one's already active.

 */
if ('serviceWorker' in navigator &&
    // block if there's already an active SW
    navigator.serviceWorker.controller === null) {
  console.log('adding service worker...');

  // add the button for push subscriptions when SW is available
      /** @type {Element} */
  var appHeader = document.getElementsByTagName('header')[0],
      /** @type {Element} */
      br = document.createElement('br'),
      /** @type {Element} */
      div = document.createElement('div');

  div.innerHTML = '<input type="checkbox" id="pushBtn"><label>' + push.subscribeText + '</label>';
  appHeader.append(br);
  appHeader.append(div);

  // push subscription initialization
  navigator.serviceWorker.register('/sw.js').then(function(registration) {
    registration.pushManager.getSubscription().then(function(subscription) {
      var pushBtn = document.getElementById('pushBtn');

      // set up button event listeners
      pushBtn.onclick = push.toggleServerSubscription(pushBtn);
      pushBtn.touchend = push.toggleServerSubscription(pushBtn);

      if (!subscription) {
        pushBtn.textContent = push.subscribeText;
      } else {
        push.toggleSubscription(subscription, pushBtn);
      }
    });
  });
}


//////////////////////////////////////////////////////////////////////
/// push subscription code

var push = {};
/** @type {string} */
push.subscribeText = 'Enable Push'; // easier to modify the msg this way
/** @type {string} */
push.unsubscribeText = 'Disable Push';

/**
 * Toggle the ServiceWorker push subscription
 *
 * @param {Element} pushBtn The button controlling push subscriptions
 */
push.toggleSubscription = function(pushBtn) {
  pushBtn.checked ? push.subscribe(pushBtn) : push.unsubscribe(pushBtn);
};

/**
 * Toggle the server subscription for push notifications
 *
 * @param {PushSubscription} subscription The push subscription
 * @param {string} action Either subscribe or unsubscribe
 * @param {Element} pushBtn The button controlling push subscriptions
 */
push.toggleServerSubscription = function(subscription, action, pushBtn) {
  var headers = {'Content-Type': 'application/json'};

  if (action == 'subscribe') {
    pushBtn.checked = true;
    pushBtn.content = 'Disable Push';

    fetch('/subscription', {
      method: 'PUT',
      headers: headers,
      body: subscription
    });
  } else {
    pushBtn.checked = true;
    pushBtn.content = 'Disable Push';

    fetch('/subscription', {
      method: 'DELETE',
      headers: headers,
      body: subscription
    });
  }
};

/**
 * Subscribes the ServiceWorker to push notifications
 *
 * @param {Element} pushBtn The button controlling push subscriptions
 */
push.subscribe = function(pushBtn) {
  navigator.serviceWorker.ready.then(function(registration) {
    registration.pushManager.subscribe({userVisibleOnly: true})
      .then(function(subscription) {
        push.toggleServerSubscription(subscription, 'subscribe');
      }).catch(function(error) {
        console.error('subscription error: ', error);
        pushBtn.content = push.subscribeText;
      });
  });
};

/**
 * Unsubscribe the ServiceWorker from push notifications
 *
 * @param {Element} pushBtn The button controlling push subscriptions
 */
push.unsubscribe = function(pushBtn) {
  navigator.serviceWorker.ready.then(function(registration) {
    registration.pushManager.getSubscription().then(function(subscription) {
      var id = subscription.subscriptionId;

      push.toggleServerSubscription(subscription, 'unsubscribe');

      subscription.unsubscribe().then(function() {
        pushBtn.content = push.unsubscribeText;
      }).catch(function(error) {
        console.error('unsubscribe error: ', error);
      });
    });
  });
};
