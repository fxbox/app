importScripts('files.js');
  importScripts('sww.js');

  var version = '1.0.0';
  var worker = new self.ServiceWorkerWare();
  worker.use(new self.StaticCacher(FILES_TO_LOAD));
  worker.use(new self.SimpleOfflineCache());

  var extraFile = 'hookSW.js';
  if (extraFile && extraFile !== 'null') {
    importScripts(extraFile);
  }

  worker.init();