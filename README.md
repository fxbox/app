# ![Foxbox Client](https://raw.githubusercontent.com/fxbox/app/master/app/img/icons/32.png "Foxbox Client") Foxbox Client

> A web client for Foxbox (with support for emulating the server component in the meantime).

## Prerequisites

Assuming you have git and [nvm](http://nvm.sh/) installed, clone this repo:

```bash
git clone https://github.com/fxbox/app
cd app
```

And then run:

```bash
$ nvm install v4.2.2
$ nvm use v4.2.2
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

## Building for Cordova

To build this app as a Cordova app, run:

```bash
npm install -g cordova
gulp cordova-setup
gulp cordova-android
```

Make sure you have either an Android device connected over the Android Debugging
Bridge, or have the Android emulator installed.

If the Android emulator starts but the app doesn't open, you can hit `^C` and
run `cd dist/cordova ; cordova emulate android` again.

You can use Chrome's dev tools -> more tools -> inspect devices
to debug the Android emulator.

For local development of the SecureHTTP plugin, you can do:

```bash
cd dist/cordova/
cordova plugin remove com.synconset.cordovaHTTP
cordova plugin add /path/to/local/SecureHTTP
cordova run android
```
