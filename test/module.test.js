import { existsSync } from 'fs'
import { join } from 'path'
import glob from 'fast-glob'
import { build } from '../index.js'
import { readFile } from './utility/file.js'
import { environment, prepare } from './utility/prepare.js'

const [fixturePath] = environment('module')

test('Can import node modules.', async () => {
  prepare('module', fixturePath)

  await build()

  const distFolder = join(fixturePath, 'dist')

  expect(existsSync(distFolder)).toEqual(true)

  const mainJs = glob.sync(['*.js'], {
    cwd: distFolder,
  })

  expect(mainJs.length).toEqual(1)

  const mainJsFilePath = join(distFolder, mainJs[0])

  expect(existsSync(mainJsFilePath)).toEqual(true)

  const mainJsContents = readFile(mainJsFilePath)

  expect(mainJsContents).toBeDefined()
  // Module found in dist file.
  expect(mainJsContents).toContain('hello')
})

test('Works with ES Module packages.', async () => {
  prepare('esmodule', fixturePath)

  await build()

  const distFolder = join(fixturePath, 'dist')

  expect(existsSync(distFolder)).toEqual(true)

  const mainJs = glob.sync(['*.js'], {
    cwd: distFolder,
  })

  expect(mainJs.length).toEqual(1)

  const mainJsFilePath = join(distFolder, mainJs[0])

  expect(existsSync(mainJsFilePath)).toEqual(true)

  const mainJsContents = readFile(mainJsFilePath)

  console.log(mainJsContents)

  // Contents of imported module imported are found in bundle.
  expect(mainJsContents).toContain('hello again')
})

test('Tree-shaking is applied to ES Modules.', async () => {
  prepare('treeshaking', fixturePath)

  await build()

  const distFolder = join(fixturePath, 'dist')

  expect(existsSync(distFolder)).toEqual(true)

  const mainJs = glob.sync(['*.js'], {
    cwd: distFolder,
  })

  expect(mainJs.length).toEqual(1)

  const mainJsFilePath = join(distFolder, mainJs[0])

  expect(existsSync(mainJsFilePath)).toEqual(true)

  const mainJsContents = readFile(mainJsFilePath)

  console.log(mainJsContents)

  // Contents of imported module imported are found in bundle.
  expect(mainJsContents).toContain('keep-me')
  expect(mainJsContents).not.toContain('remove-me')
})
