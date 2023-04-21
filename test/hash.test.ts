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

process.env.PAPUA_TEST = 'true'

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

test('Hashing in production can be disabled.', async () => {
  const { dist } = prepare([
    packageJson('hash-disabled', { papua: { hash: false } }),
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

  const files = listFilesMatching('**/*', dist)

  expect(files).toContain('main.js')
  expect(files).toContain('main.css')
  expect(files).toContain('logo.load.png')
})

test('Can load images with query parameter.', async () => {
  const { dist } = prepare([
    packageJson('hash-query', { papua: { hash: false } }),
    file(
      'index.js',
      `import './nested/logo.load.png?width=300';
    
    console.log('test')`
    ),
    {
      name: 'nested/logo.load.png',
      copy: 'test/asset/logo.png',
    },
  ])

  await build(false)

  const files = listFilesMatching('**/*', dist)

  expect(files).toContain('main.js')
  // TODO query param found neither in bundle nor path...
  expect(files).toContain('nested/logo.load.png')
})
