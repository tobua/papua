import { existsSync } from 'fs'
import { join } from 'path'
import { build } from '../index.js'
import { readFile } from './utility/file.js'
import {
  listFilesMatching,
  contentsForFilesMatching,
} from './utility/helper.js'
import { environment, prepare } from './utility/prepare.js'
import {
  packageJson,
  indexJavaScript,
  pngLogo,
  anyFile,
} from './utility/structures.js'

const [fixturePath] = environment('build')

test('Builds without errors.', async () => {
  const { dist } = prepare('build', fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  // JS and map for main chunk are available.
  expect(listFilesMatching('*.js', dist).length).toEqual(1)
  expect(listFilesMatching('*.js.map', dist).length).toEqual(1)
})

test('No public path applied properly in bundle.', async () => {
  const noPublicPathStructure = [
    packageJson('publicpath'),
    indexJavaScript(`import logo from 'logo.png'; console.log(logo)`),
    pngLogo,
  ]

  const { dist } = prepare(noPublicPathStructure, fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))
  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents
  const mainJsName = listFilesMatching('*.js', dist)[0]
  const pngName = listFilesMatching('*.png', dist)[0]

  // Proper path to main bundle.
  expect(htmlContents).toContain(`src="${mainJsName}"`)
  // Proper path to logo.
  expect(mainJsContents).toContain(`"${pngName}"`)
})

test('Root public path applied properly in bundle.', async () => {
  const noPublicPathStructure = [
    packageJson('publicpath', { publicPath: '/' }),
    indexJavaScript(`import logo from 'logo.png'; console.log(logo)`),
    pngLogo,
  ]

  const { dist } = prepare(noPublicPathStructure, fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))
  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents
  const mainJsName = listFilesMatching('*.js', dist)[0]
  const pngName = listFilesMatching('*.png', dist)[0]

  // Proper path to main bundle.
  expect(htmlContents).toContain(`src="/${mainJsName}"`)
  // Proper path to logo.
  expect(mainJsContents).toContain(`"/${pngName}"`)
})

test('Deep public path applied properly in bundle.', async () => {
  const path = 'hello/world'
  const noPublicPathStructure = [
    packageJson('publicpath', { publicPath: path }),
    indexJavaScript(`import logo from 'logo.png'; console.log(logo)`),
    pngLogo,
  ]

  const { dist } = prepare(noPublicPathStructure, fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))
  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents
  const mainJsName = listFilesMatching('*.js', dist)[0]
  const pngName = listFilesMatching('*.png', dist)[0]

  // Proper path to main bundle.
  expect(htmlContents).toContain(`src="/${path}/${mainJsName}"`)
  // Proper path to logo.
  expect(mainJsContents).toContain(`"/${path}/${pngName}"`)
})

test('Papua html template is used.', async () => {
  const title = 'The title hello'
  const htmlTemplateStructure = [
    packageJson('html-template', { title }),
    indexJavaScript(),
  ]

  const { dist } = prepare(htmlTemplateStructure, fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))

  // Custom papua template is used.
  expect(htmlContents).toContain(title)
  expect(htmlContents).toContain('width=device-width')
})

test('Html template can be customized.', async () => {
  const title = 'The title hello'
  const loadingMessage = 'Still loading, sorry for the inconvenience.'
  const customTemplateStructure = [
    packageJson('custom-template', { html: { template: 'custom.html' } }),
    indexJavaScript(),
    anyFile(
      'custom.html',
      `<html>
  <body>
    <p>${loadingMessage}</p>
  </body>
</html>`
    ),
  ]

  const { dist } = prepare(customTemplateStructure, fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))

  // Custom user template is used.
  expect(htmlContents).not.toContain(title)
  expect(htmlContents).toContain(loadingMessage)
  expect(htmlContents).not.toContain('width=device-width')
})
