import { existsSync } from 'fs'
import { watch } from '../index.js'
import { writeFile } from './utility/file.js'
import { environment, prepare } from './utility/prepare.js'
import {
  packageJson,
  indexJavaScript,
  javaScriptFile,
  pngLogo,
} from './utility/structures.js'
import {
  wait,
  closeWatcher,
  listFilesMatching,
  contentsForFilesMatching,
} from './utility/helper.js'

const [fixturePath] = environment('watch')

test('Watcher rebuilds on file change.', async () => {
  const watchRebuildStructure = [
    packageJson('watch-rebuild', { html: false }),
    indexJavaScript(`import 'imported.js'; console.log('hello_index')`),
    javaScriptFile('imported.js', `console.log('hello_imported')`),
  ]
  const { dist } = prepare(watchRebuildStructure, fixturePath)

  const watcher = await watch()

  // Wait for initial compilation to finish.
  await wait(10)

  expect(existsSync(dist)).toEqual(true)

  let jsContents = contentsForFilesMatching('*.js', dist)

  expect(jsContents[0].contents).toContain('hello_index')
  expect(jsContents[0].contents).toContain('hello_imported')
  expect(jsContents[0].contents).not.toContain('hello_newfile')

  writeFile('index.js', `console.log('hello_newfile')`)

  // Wait one second to ensure watcher recompilation done.
  await wait(1)

  // Refresh contents.
  jsContents = contentsForFilesMatching('*.js', dist)

  expect(jsContents[0].contents).not.toContain('hello_index')
  expect(jsContents[0].contents).not.toContain('hello_imported')
  expect(jsContents[0].contents).toContain('hello_newfile')

  await closeWatcher(watcher)
})

// NOTE useless test (expected opposite...) keeping for other purposes.
test('Removed imports are not removed from dist during watch.', async () => {
  const watchRebuildStructure = [
    packageJson('watch-remove-files', { html: false }),
    indexJavaScript(`import logo from 'logo.png'; console.log(logo)`),
    pngLogo,
  ]
  const { dist } = prepare(watchRebuildStructure, fixturePath)

  const watcher = await watch()

  // Wait for initial compilation to finish.
  await wait(5)

  let imageFiles = listFilesMatching('*.png', dist)

  expect(imageFiles.length).toEqual(1)

  writeFile('index.js', `console.log('empty')`)

  // Wait one second to ensure watcher recompilation done.
  await wait(1)

  imageFiles = listFilesMatching('*.png', dist)

  expect(imageFiles.length).toEqual(1)

  await closeWatcher(watcher)
})
