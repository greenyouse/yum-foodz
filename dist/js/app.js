"serviceWorker"in navigator&&null===navigator.serviceWorker.controller&&(console.log("adding service worker..."),navigator.serviceWorker.register("/sw.js"));
