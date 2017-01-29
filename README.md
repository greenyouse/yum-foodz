# Yum Foodz

[Yum Foodz](https://yum-foodz.herokuapp.com) is a recipe manager that
uses cutting edge features of a progressive web app.

It was my entry for the 10k Apart contest and final project for my
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
