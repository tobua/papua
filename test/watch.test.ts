import { existsSync } from 'fs'
import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  registerVitest,
  environment,
  prepare,
  packageJson,
  file,
  listFilesMatching,
  contentsForFilesMatching,
  writeFile,
  wait,
} from 'jest-fixture'
import { watch } from '../index'
import { refresh } from '../utility/helper'

registerVitest(beforeEach, afterEach, vi)

const [fixturePath] = environment('watch')

beforeEach(refresh)

test('Watcher rebuilds on file change.', async () => {
  const watchRebuildStructure = [
    packageJson('watch-rebuild', { html: false }),
    file('index.js', `import './imported.js'; console.log('hello_index')`),
    file('imported.js', `console.log('hello_imported')`),
  ]
  const { dist } = prepare(watchRebuildStructure, fixturePath)

  const { close } = await watch(false)

  // Wait for initial compilation to finish.
  await wait(1)

  expect(existsSync(dist)).toEqual(true)

  let jsContents = contentsForFilesMatching('*.js', dist)

  expect(jsContents[0].contents).toContain('hello_index')
  expect(jsContents[0].contents).toContain('hello_imported')
  expect(jsContents[0].contents).not.toContain('hello_newfile')

  writeFile('imported.js', `console.log('hello_new_imported')`)

  // Wait one second to ensure watcher recompilation done.
  await wait(0.3)

  // Refresh contents.
  jsContents = contentsForFilesMatching('*.js', dist)

  expect(jsContents[0].contents).toContain('hello_index')
  expect(jsContents[0].contents).not.toContain('hello_imported')
  expect(jsContents[0].contents).toContain('hello_new_imported')

  writeFile('index.js', `console.log('hello_newfile')`)

  // Wait one second to ensure watcher recompilation done.
  await wait(0.3)

  // Refresh contents.
  jsContents = contentsForFilesMatching('*.js', dist)

  expect(jsContents[0].contents).not.toContain('hello_index')
  expect(jsContents[0].contents).not.toContain('hello_imported')
  expect(jsContents[0].contents).toContain('hello_newfile')
  expect(jsContents[0].contents).not.toContain('hello_new_imported')

  await close()
})

// NOTE useless test (expected opposite...) keeping for other purposes.
// test('Removed imports are not removed from dist during watch.', async () => {
//   const watchRebuildStructure = [
//     packageJson('watch-remove-files', { html: false }),
//     file('index.js', `import logo from 'logo.png'; console.log(logo)`),
//     {
//       name: 'logo.png',
//       copy: 'test/asset/logo.png',
//     },
//   ]
//   const { dist } = prepare(watchRebuildStructure, fixturePath)

//   const watcher = await watch()

//   // Wait for initial compilation to finish.
//   await wait(5)

//   let imageFiles = listFilesMatching('*.png', dist)

//   expect(imageFiles.length).toEqual(1)

//   writeFile('index.js', `console.log('empty')`)

//   // Wait one second to ensure watcher recompilation done.
//   await wait(1)

//   imageFiles = listFilesMatching('*.png', dist)

//   expect(imageFiles.length).toEqual(1)

//   await closeWatcher(watcher)
// })
