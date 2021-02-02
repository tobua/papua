export const wait = (seconds) =>
  new Promise((done) => setTimeout(() => done(), seconds * 1000))

export const closeWatcher = (watcher) =>
  new Promise((done) => watcher.close(() => done()))
