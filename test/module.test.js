import { existsSync } from 'fs'
import { join } from 'path'
import glob from 'fast-glob'
import { build } from '../index.js'
import { prepare } from './utility/prepare.js'
import { readFile } from './utility/file.js'

prepare('module')

test('Can import node modules.', async () => {
  await build()

  expect(existsSync(join(global.PATH, 'dist'))).toEqual(true)

  const mainJs = glob.sync(['*.js'], {
    cwd: join(global.PATH, 'dist'),
  })

  expect(mainJs.length).toEqual(1)

  const mainJsFilePath = join(global.PATH, `dist/${mainJs[0]}`)

  expect(existsSync(mainJsFilePath)).toEqual(true)

  const mainJsContents = readFile(mainJsFilePath)

  expect(mainJsContents).toBeDefined()
  // Module found in dist file.
  expect(mainJsContents).toContain('hello')
})
