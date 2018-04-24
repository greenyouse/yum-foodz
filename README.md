# Yum Foodz

[Yum Foodz](https://yum-foodz.herokuapp.com) is a recipe manager that
that demonstrates the features of a progressive web app.

This was my entry for the 10k Apart contest and final project for my
Senior Web Developer Nanodegree from Udacity. It was cooked up in about
two weeks to meet the contest deadline.  

## Features

- each page under 10kB (not counting images and ServiceWorker caching)
- responsive
- progressive enhancement
- app shell architecture
- renders in about 400 milliseconds
- works offline with ServiceWorkers
- can install to home screen on mobile
- sends food of the day updates using push notifications

## Coding Style + Notes

The code in the templates folder is built with ES6 template
strings. If you see JS sprinkled throughout the HTML and templating
logic that's what's going on. The code is served via a Node.js so that
is where the server side templating happens.

There's a service worker in `templates/sw.js` that does much of the
heavy lifting after the client has visited the page. It will install
itself into the browser, cache pages, serve the cached pages, save user
data to indexedDB, and do push messaging. This duplicates what the
Node.js server does so the app should work just fine offline by
leveraging the service worker.

The build process was pretty heavily optimized to keep file sizes
down. Although some files may look to be around 10k the size measurement
happens *after* gzip compression from the server. That usually cuts the
file size in half or better.

The app will probably not work if used locally. The service worker
follows the web browser's content security policy so it needs its own
domain (not the localhost). See below for a live version of the app.

## Try It Out

There's a live version [hosted here](https://yum-foodz.herokuapp.com). Push
notifications aren't currently working in Chrome browsers (external library
issue) but Firefox works great.

For running locally, clone and build like this:

```sh
git clone https://github.com/greenyouse/yum-foodz
cd yum-foodz
npm install
npm run compile
npm run serve
```

After that it should be ready at [localhost:5000](http://localhost:5000)
