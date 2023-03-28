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
  contentsForFilesMatching,
  readFile,
} from 'jest-fixture'
import { build } from '../index'
import { refresh } from '../utility/helper'

registerVitest(beforeEach, afterEach, vi)

environment('build')

beforeEach(refresh)

const pngLogo = {
  name: 'logo.png',
  copy: 'test/asset/logo.png',
}

test('Builds without errors.', async () => {
  const { dist } = prepare([packageJson('build'), file('index.js', `console.log('test')`)])

  expect(true).toBe(true)

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  // JS and map for main chunk are available.
  expect(listFilesMatching('*.js', dist).length).toEqual(1)
  expect(listFilesMatching('*.js.map', dist).length).toEqual(1)
})

// test('No public path applied properly in bundle.', async () => {
//   const { dist } = prepare([
//     packageJson('publicpath'),
//     file('index.js', `import logo from 'logo.png'; console.log(logo)`),
//     pngLogo,
//   ])

//   await build()

//   expect(existsSync(dist)).toEqual(true)
//   expect(existsSync(join(dist, 'index.html'))).toEqual(true)

//   const htmlContents = readFile(join(dist, 'index.html'))
//   const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents
//   const mainJsName = listFilesMatching('*.js', dist)[0]
//   const pngName = listFilesMatching('*.png', dist)[0]

//   // Proper path to main bundle.
//   expect(htmlContents).toContain(`src="${mainJsName}"`)
//   // Proper path to logo.
//   expect(mainJsContents).toContain(`"${pngName}"`)
// })

// test('Root public path applied properly in bundle.', async () => {
//   const { dist } = prepare([
//     packageJson('publicpath', { papua: { publicPath: '/' } }),
//     file('index.js', `import logo from 'logo.png'; console.log(logo)`),
//     pngLogo,
//   ])

//   await build()

//   expect(existsSync(dist)).toEqual(true)
//   expect(existsSync(join(dist, 'index.html'))).toEqual(true)

//   const htmlContents = readFile(join(dist, 'index.html'))
//   const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents
//   const mainJsName = listFilesMatching('*.js', dist)[0]
//   const pngName = listFilesMatching('*.png', dist)[0]

//   if (process.platform === 'win32') {
//     // Proper path to main bundle.
//     expect(htmlContents).toContain(`src="\\/${mainJsName}"`)
//     // Proper path to logo.
//     expect(mainJsContents).toContain(`"\\\\${pngName}"`)
//   } else {
//     // Proper path to main bundle.
//     expect(htmlContents).toContain(`src="/${mainJsName}"`)
//     // Proper path to logo.
//     expect(mainJsContents).toContain(`"/${pngName}"`)
//   }
// })

// test('Deep public path applied properly in bundle.', async () => {
//   const path = 'hello/world'
//   const { dist } = prepare([
//     packageJson('publicpath', { papua: { publicPath: path } }),
//     file('index.js', `import logo from 'logo.png'; console.log(logo)`),
//     pngLogo,
//   ])

//   await build()

//   expect(existsSync(dist)).toEqual(true)
//   expect(existsSync(join(dist, 'index.html'))).toEqual(true)

//   const htmlContents = readFile(join(dist, 'index.html'))
//   const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents
//   const mainJsName = listFilesMatching('*.js', dist)[0]
//   const pngName = listFilesMatching('*.png', dist)[0]

//   if (process.platform === 'win32') {
//     // Proper path to main bundle.
//     expect(htmlContents).toContain(`src="\\hello\\world\\/${mainJsName}"`)
//     // Proper path to logo.
//     expect(mainJsContents).toContain(`"\\\\hello\\\\world\\\\${pngName}"`)
//   } else {
//     // Proper path to main bundle.
//     expect(htmlContents).toContain(`src="/${path}/${mainJsName}"`)
//     // Proper path to logo.
//     expect(mainJsContents).toContain(`"/${path}/${pngName}"`)
//   }
// })

test('Papua html template is used.', async () => {
  const title = 'The title hello'
  const { dist } = prepare([
    packageJson('html-template', { papua: { title } }),
    file('index.js', ''),
  ])

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))

  // Custom papua template is used.
  expect(htmlContents).toContain(title)
  expect(htmlContents).toContain('width=device-width')
})

// test('Html template can be customized.', async () => {
//   const title = 'The title hello'
//   const loadingMessage = 'Still loading, sorry for the inconvenience.'
//   const { dist } = prepare([
//     packageJson('custom-template', {
//       papua: { html: { template: 'custom.html' } },
//     }),
//     file('index.js', ''),
//     file(
//       'custom.html',
//       `<html>
//   <body>
//     <p>${loadingMessage}</p>
//   </body>
// </html>`
//     ),
//   ])

//   await build()

//   expect(existsSync(dist)).toEqual(true)
//   expect(existsSync(join(dist, 'index.html'))).toEqual(true)

//   const htmlContents = readFile(join(dist, 'index.html'))

//   // Custom user template is used.
//   expect(htmlContents).not.toContain(title)
//   expect(htmlContents).toContain(loadingMessage)
//   expect(htmlContents).not.toContain('width=device-width')
// })

// test('Generates and injects favicons.', async () => {
//   const { dist } = prepare([packageJson('favicons'), file('index.js', '')])

//   await build()

//   expect(existsSync(dist)).toEqual(true)
//   expect(existsSync(join(dist, 'index.html'))).toEqual(true)

//   const htmlContents = readFile(join(dist, 'index.html'))

//   // Favicons are injected.
//   expect(htmlContents).toContain('assets/favicon.png')
// })
