import { existsSync } from 'fs'
import { join } from 'path'
import { build } from '../index.js'
import { environment, prepare } from './utility/prepare.js'
import { listFilesMatching } from './utility/helper.js'

const [fixturePath] = environment('hash')

test('Various production file types contain content hashes.', async () => {
  const { dist } = prepare('hash', fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const mainJsFiles = listFilesMatching('main.*.js', dist)
  const mainJsMapFiles = listFilesMatching('main.*.js.map', dist)
  const stylesFiles = listFilesMatching('*.css', dist)
  const imagesFiles = listFilesMatching('*.png')

  // JS and map for main chunk are available.
  expect(mainJsFiles.length).toEqual(1)
  expect(mainJsMapFiles.length).toEqual(1)
  expect(stylesFiles.length).toEqual(1)
  expect(imagesFiles.length).toEqual(1)
  // Includes a lengthy contenthash.
  expect(mainJsFiles[0].length).toBeGreaterThan(20)
  expect(mainJsMapFiles[0].length).toBeGreaterThan(20)
})
