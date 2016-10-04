/*
 basic SW registration

 I'm currently requesting the whole page instead of using XHR for the page
 inside the app-shell. To avoid registering a new SW every time, I put in
 a check that will block new SW registration if one's already active.

 */
if ('serviceWorker' in navigator &&
    // block if there's already an active SW
    navigator.serviceWorker.controller === null) {
  console.log('adding service worker...');
  navigator.serviceWorker.register('/sw.js');
}
