# Yum Foodz

This is a recipe manager to make organizing recipes easier. It was built
with an offline-first approach and can do client-side routing and
templating if ServiceWorkers are enabled. On more limited browsers it
will fall back to using server-side templating with HTTP caching. 

It was my entry for the 10k Apart contest and final project for my
Senior Web Developer Nanodegree from Udacity.

## Features

- each page under 10kB (not counting images and ServiceWorker caching)
- responsive
- progressive enhancement
- app shell architecture
- works offline with ServiceWorkers
- can install to home screen on mobile
- sends food of the day updates using push notifications

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
