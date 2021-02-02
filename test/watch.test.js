import { existsSync } from 'fs'
import { join } from 'path'
import glob from 'fast-glob'
import { watch } from '../index.js'
import { readFile, writeFile } from './utility/file.js'
import { environment, prepare } from './utility/prepare.js'
import { wait, closeWatcher } from './utility/helper.js'
import {
  packageJson,
  indexJavaScript,
  javaScriptFile,
  pngLogo,
} from './utility/structures.js'

const [fixturePath] = environment('watch')

test('Watcher rebuilds on file change.', async () => {
  const watchRebuildStructure = [
    packageJson('watch-rebuild', { html: false }),
    indexJavaScript(`import 'imported.js'; console.log('hello_index')`),
    javaScriptFile('imported.js', `console.log('hello_imported')`),
  ]
  prepare(watchRebuildStructure, fixturePath)

  const watcher = await watch()

  // Wait for initial compilation to finish.
  await wait(5)

  const distFolder = join(fixturePath, 'dist')

  expect(existsSync(distFolder)).toEqual(true)

  const mainJs = glob.sync(['*.js'], {
    cwd: distFolder,
  })

  let mainJsContents = readFile(join(distFolder, mainJs[0]))

  expect(mainJsContents).toContain('hello_index')
  expect(mainJsContents).toContain('hello_imported')
  expect(mainJsContents).not.toContain('hello_newfile')

  writeFile('index.js', `console.log('hello_newfile')`)

  // Wait one second to ensure watcher recompilation done.
  await wait(1)

  // Refresh contents.
  mainJsContents = readFile(join(distFolder, mainJs[0]))

  expect(mainJsContents).not.toContain('hello_index')
  expect(mainJsContents).not.toContain('hello_imported')
  expect(mainJsContents).toContain('hello_newfile')

  await closeWatcher(watcher)
})

test('Removed imports are not removed from dist during watch.', async () => {
  const watchRebuildStructure = [
    packageJson('watch-remove-files', { html: false }),
    indexJavaScript(`import logo from 'logo.png'; console.log(logo)`),
    pngLogo,
  ]
  prepare(watchRebuildStructure, fixturePath)

  const watcher = await watch()

  // Wait for initial compilation to finish.
  await wait(5)

  const distFolder = join(fixturePath, 'dist')

  let logo = glob.sync(['*.png'], {
    cwd: distFolder,
  })

  expect(logo.length).toEqual(1)

  writeFile('index.js', `console.log('empty')`)

  // Wait one second to ensure watcher recompilation done.
  await wait(1)

  logo = glob.sync(['*.png'], {
    cwd: distFolder,
  })

  expect(logo.length).toEqual(1)

  await closeWatcher(watcher)
})
