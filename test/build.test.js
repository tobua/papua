import { existsSync } from 'fs'
import { join } from 'path'
import glob from 'fast-glob'
import { build } from '../index.js'
import { environment, prepare } from './utility/prepare.js'

const [fixturePath] = environment('build')

test('Builds without errors.', async () => {
  console.log(fixturePath)
  prepare('build', fixturePath)

  await build()

  const distFolder = join(fixturePath, 'dist')

  expect(existsSync(distFolder)).toEqual(true)
  expect(existsSync(join(distFolder, 'index.html'))).toEqual(true)

  const mainJs = glob.sync(['*.js'], {
    cwd: distFolder,
  })

  const mainJsMap = glob.sync(['*.js.map'], {
    cwd: distFolder,
  })

  // JS and map for main chunk are available.
  expect(mainJs.length).toEqual(1)
  expect(mainJsMap.length).toEqual(1)
})
