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
