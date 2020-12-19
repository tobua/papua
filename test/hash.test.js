import { existsSync } from 'fs'
import { join } from 'path'
import glob from 'fast-glob'
import { build } from '../index.js'
import { prepare } from './utility/prepare.js'

prepare('hash')

test('Builds without errors.', async () => {
  await build()

  expect(existsSync(join(global.PATH, 'dist'))).toEqual(true)
  expect(existsSync(join(global.PATH, 'dist/index.html'))).toEqual(true)

  const mainJs = glob.sync(['main.*.js'], {
    cwd: join(global.PATH, 'dist'),
  })

  const mainJsMap = glob.sync(['main.*.js.map'], {
    cwd: join(global.PATH, 'dist'),
  })

  const styles = glob.sync(['*.css'], {
    cwd: join(global.PATH, 'dist'),
  })

  const images = glob.sync(['*.png'], {
    cwd: join(global.PATH, 'dist'),
  })

  // JS and map for main chunk are available.
  expect(mainJs.length).toEqual(1)
  expect(mainJsMap.length).toEqual(1)
  expect(styles.length).toEqual(1)
  expect(images.length).toEqual(1)
  // Includes a lengthy contenthash.
  expect(mainJs[0].length).toBeGreaterThan(20)
  expect(mainJsMap[0].length).toBeGreaterThan(20)
})
