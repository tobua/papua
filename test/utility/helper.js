import { join } from 'path'
import glob from 'fast-glob'
import { readFile } from './file.js'

export const wait = (seconds) =>
  new Promise((done) => setTimeout(() => done(), seconds * 1000))

export const closeWatcher = (watcher) =>
  new Promise((done) => watcher.close(() => done()))

export const listFilesMatching = (matcher, folder) =>
  glob.sync([matcher], {
    cwd: folder,
  })

export const contentsForFilesMatching = (matcher, folder) => {
  const files = listFilesMatching(matcher, folder)

  return files.map((fileName) => ({
    name: fileName,
    contents: readFile(join(folder, fileName)),
  }))
}
