import { existsSync } from 'fs'
import { join } from 'path'
import glob from 'fast-glob'
import { build } from '../index.js'
import { environment, prepare } from './utility/prepare.js'

const [fixturePath] = environment('hash')

test('Various production file types contain content hashes.', async () => {
  prepare('hash', fixturePath)

  await build()

  const distFolder = join(fixturePath, 'dist')

  expect(existsSync(distFolder)).toEqual(true)
  expect(existsSync(join(distFolder, 'index.html'))).toEqual(true)

  const mainJs = glob.sync(['main.*.js'], {
    cwd: distFolder,
  })

  const mainJsMap = glob.sync(['main.*.js.map'], {
    cwd: distFolder,
  })

  const styles = glob.sync(['*.css'], {
    cwd: distFolder,
  })

  const images = glob.sync(['*.png'], {
    cwd: distFolder,
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
