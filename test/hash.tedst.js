import { existsSync } from 'fs'
import { join } from 'path'
import { environment, prepare, packageJson, file, listFilesMatching } from 'jest-fixture'
import { build } from '../index'
import { refresh } from '../utility/helper'

// Build can take more than 5 seconds.
jest.setTimeout(60000)

environment('hash')

beforeEach(refresh)

test('Various production file types contain content hashes.', async () => {
  const { dist } = prepare([
    packageJson('hash'),
    file(
      'index.js',
      `import './styles.css';
    import './logo.png';
    
    console.log('test')`
    ),
    file('styles.css', 'p { color: red; }'),
    {
      name: 'logo.png',
      copy: 'test/asset/logo.png',
    },
  ])

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
