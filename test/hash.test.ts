import { existsSync } from 'fs'
import { join } from 'path'
import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  registerVitest,
  environment,
  prepare,
  packageJson,
  file,
  listFilesMatching,
} from 'jest-fixture'
import { build } from '../index'
import { refresh } from '../utility/helper'

registerVitest(beforeEach, afterEach, vi)

environment('hash')

beforeEach(refresh)

test('Various production file types contain content hashes.', async () => {
  const { dist } = prepare([
    packageJson('hash'),
    file(
      'index.js',
      `import './styles.css';
    import './logo.load.png';
    
    console.log('test')`
    ),
    file('styles.css', 'p { color: red; }'),
    {
      name: 'logo.load.png',
      copy: 'test/asset/logo.png',
    },
  ])

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const mainJsFiles = listFilesMatching('main.*.js', dist)
  const mainJsMapFiles = listFilesMatching('main.*.js.map', dist)
  const stylesFiles = listFilesMatching('*.css', dist)
  const imagesFiles = listFilesMatching('*.png', dist)

  // JS and map for main chunk are available.
  expect(mainJsFiles.length).toEqual(1)
  expect(mainJsMapFiles.length).toEqual(1)
  expect(stylesFiles.length).toEqual(1)
  expect(imagesFiles.length).toEqual(2)
  // Includes a lengthy contenthash.
  expect(mainJsFiles[0].length).toBeGreaterThan(20)
  expect(mainJsMapFiles[0].length).toBeGreaterThan(20)
})
