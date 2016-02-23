# ![Foxbox Client](https://raw.githubusercontent.com/fxbox/app/master/app/img/icons/32.png "Foxbox Client") Foxbox Client

> A client for Foxbox

## Prerequisites

Assuming you have git and [nvm](http://nvm.sh/) installed, clone this repo:

```bash
git clone https://github.com/fxbox/app
cd app
```

And then run:

```bash
$ nvm install 0.11.4
$ nvm use 0.11.4
$ npm install -g gulp
```

## How to build?

```bash
$ npm install
$ git checkout -- gulpfile.js
$ gulp
```

Then point your browser to [http://localhost:8000](http://localhost:8000/).

Note: The site is built in the `dist/app` folder.
