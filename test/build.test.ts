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
  json,
} from 'jest-fixture'
import { build } from '../index'
import { refresh } from '../utility/helper'
import { writeConfiguration } from '../utility/configuration'

registerVitest(beforeEach, afterEach, vi)

environment('build')

beforeEach(refresh)

const pngLogo = {
  name: 'logo.load.png',
  copy: 'test/asset/logo.png',
}

test('Builds without errors.', async () => {
  const { dist } = prepare([packageJson('build'), file('index.js', `console.log('test')`)])

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  // JS and map for main chunk are available.
  expect(listFilesMatching('*.js', dist).length).toEqual(1)
  expect(listFilesMatching('*.js.map', dist).length).toEqual(1)
})

test('No public path applied properly in bundle.', async () => {
  const { dist } = prepare([
    packageJson('publicpath'),
    file('index.js', `import logo from 'logo.load.png'; console.log(logo)`),
    pngLogo,
  ])

  await build(true)

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
  const { dist } = prepare([
    packageJson('publicpath', { papua: { publicPath: '/' } }),
    file('index.js', `import logo from 'logo.load.png'; console.log(logo)`),
    pngLogo,
  ])

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))
  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents
  const mainJsName = listFilesMatching('*.js', dist)[0]
  const pngName = listFilesMatching('**/*.png', dist)[0]

  if (process.platform === 'win32') {
    // Proper path to main bundle.
    expect(htmlContents).toContain(`src="\\/${mainJsName}"`)
    // Proper path to logo.
    expect(mainJsContents).toContain(`"\\\\${pngName}"`)
  } else {
    // Proper path to main bundle.
    expect(htmlContents).toContain(`src="/${mainJsName}"`)
    // Proper path to logo, public path programmatically added only once.
    expect(mainJsContents).toContain(`"${pngName}"`)
    expect(mainJsContents).toContain(`"/"`)
  }
})

test('Deep public path applied properly in bundle.', async () => {
  const path = '/hello/world'
  const { dist } = prepare([
    packageJson('publicpath', { papua: { publicPath: path } }),
    file('index.js', `import logo from 'logo.load.png'; console.log(logo)`),
    pngLogo,
  ])

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))
  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents
  const mainJsName = listFilesMatching('*.js', dist)[0]
  const pngName = listFilesMatching('*.png', dist)[0]

  if (process.platform === 'win32') {
    // Proper path to main bundle.
    expect(htmlContents).toContain(`src="\\hello\\world\\/${mainJsName}"`)
    // Proper path to logo.
    expect(mainJsContents).toContain(`"\\\\hello\\\\world\\\\${pngName}"`)
  } else {
    // Proper path to main bundle.
    expect(htmlContents).toContain(`src="${path}/${mainJsName}"`)
    // Proper path to logo, public path programmatically added only once.
    expect(mainJsContents).toContain(`"${path}/"`)
    expect(mainJsContents).toContain(`"${pngName}"`)
  }
})

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

test('Html template can be customized.', async () => {
  const title = 'The title hello'
  const loadingMessage = 'Still loading, sorry for the inconvenience.'
  const { dist } = prepare([
    packageJson('custom-template', {
      papua: { html: { template: 'custom.html' } },
    }),
    file('index.js', ''),
    file(
      'custom.html',
      `<html>
  <body>
    <p>${loadingMessage}</p>
  </body>
</html>`
    ),
  ])

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))

  // Custom user template is used.
  expect(htmlContents).not.toContain(title)
  expect(htmlContents).toContain(loadingMessage)
  expect(htmlContents).not.toContain('width=device-width')
})

test('Defined environment variables are resolved.', async () => {
  const path = '/hello'
  const { dist } = prepare([
    packageJson('build-env', { papua: { publicPath: path } }),
    file('index.js', `console.log(process.env.PUBLIC_URL)`),
  ])

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain(`"${path}/"`)
})

test('Files inside the /public folder are copied over to the root.', async () => {
  prepare([
    packageJson('build-copy'),
    file('index.js', `console.log("copy")`),
    file('public/favicon.ico', ''),
    file('public/something.png', ''),
    file('public/nested/template.html', ''),
  ])

  await build(false)

  const files = listFilesMatching('**/*', '.')

  expect(files).toContain('dist/favicon.ico')
  expect(files).toContain('dist/something.png')
  expect(files).toContain('dist/nested/template.html')
})

test('Generates and injects favicons.', async () => {
  const { dist } = prepare([packageJson('favicons'), file('index.js', '')])

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))
  const imageFiles = listFilesMatching('**/*.png', '.')

  // Favicon is injected.
  expect(htmlContents).toContain('<link rel="icon" href="logo.png">')
  // Image is present in output.
  expect(imageFiles).toContain('dist/logo.png')
})

test('Favicon can be customized.', async () => {
  const { dist } = prepare([
    packageJson('custom-favicon', { papua: { icon: 'nested/hello.png' } }),
    file('index.js', ''),
    {
      name: 'nested/hello.png',
      copy: 'test/asset/logo.png',
    },
  ])

  await build(false)

  const htmlContents = readFile(join(dist, 'index.html'))
  const imageFiles = listFilesMatching('**/*.png', '.')

  // Nesting is removed, as unnecessary.
  expect(htmlContents).toContain('<link rel="icon" href="hello.png">')
  expect(imageFiles).toContain('dist/hello.png')
})

test('Can import CSS.', async () => {
  const { dist } = prepare([
    packageJson('build'),
    file('index.js', `import './index.css'`),
    file('index.css', 'body { background: red; }'),
  ])

  await build(false)

  const htmlContents = readFile(join(dist, 'index.html')) //
  const cssFileName = listFilesMatching('*.css', dist)[0]
  const cssContents = contentsForFilesMatching('*.css', dist)[0].contents

  expect(listFilesMatching('*.css', dist).length).toEqual(1)
  expect(listFilesMatching('*.css.map', dist).length).toEqual(1)

  // Minified in production.
  expect(cssContents).toContain('background:red')
  // CSS file injected into HTML template.
  expect(htmlContents).toContain(`href="${cssFileName}"`)
  expect(htmlContents).toContain('rel="stylesheet"')
})

test('Can import JSON.', async () => {
  const { dist } = prepare([
    packageJson('build'),
    file(
      'index.js',
      `import content from './index.json'; import { hello } from './index.json'; console.log(content, hello)`
    ),
    json('index.json', { hello: 'world' }),
  ])

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain('{hello:"world"}')
})

test('Service worker is built and injected with appropriate plugin if present.', async () => {
  const { dist } = prepare([
    packageJson('build'),
    file('index.js', 'console.log("hey")'),
    file('service-worker.js', 'console.log("worker")'),
  ])

  await build(false)

  const files = listFilesMatching('**/*.js', dist)

  // TODO workbox plugin not yet supported.
  expect(files.length).toBe(1)
})

test('Installs listed localDependencies.', async () => {
  const { dist } = prepare([
    packageJson('local-dependencies', {
      localDependencies: {
        somethang: '../somethang',
        anotherthang: './some/another-thang',
      },
    }),
    json('../somethang/package.json', {
      name: 'somethang',
      main: './index.js',
    }),
    file('../somethang/index.js', 'export default () => "somethang"'),
    json('some/another-thang/package.json', {
      name: 'anotherthang',
      main: './index.js',
    }),
    file('some/another-thang/index.js', 'export default () => "anotherthang"'),
    // Ensure node_modules exist (which is the case on postinstall).
    json('node_modules/installed/package.json', { name: 'installed' }),
    // Imports symlinked modules.
    file(
      'index.js',
      `import somethang from 'somethang'; import anotherthang from 'anotherthang'; console.log(somethang, anotherthang)`
    ),
  ])

  await writeConfiguration(false)
  await writeConfiguration(false) // Can be run multiple times.

  const files = listFilesMatching('**/*', '.')
  const somethangIndexContents = readFile('node_modules/somethang/index.js')

  expect(files).toContain('node_modules/somethang/package.json')
  expect(files).toContain('node_modules/anotherthang/index.js')
  expect(somethangIndexContents).toContain('"somethang"')

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain('"anotherthang"')
  expect(mainJsContents).toContain('"somethang"')
})

test('Supports multiple entry files.', async () => {
  const { dist } = prepare([
    packageJson('entry-array', { papua: { entry: ['./index.js', './another.js'] } }),
    file('index.js', 'console.log("index")'),
    file('another.js', 'console.log("another")'),
  ])

  await build(false)

  const files = listFilesMatching('**/*.js', dist)

  // Multiple entry files merged into single bundle.
  expect(files.length).toBe(1)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain('"index"')
  expect(mainJsContents).toContain('"another"')
})

test('Supports multiple entry chunks.', async () => {
  const { dist } = prepare([
    packageJson('entry-array', {
      papua: { entry: { main: './index.js', another: './another.js' } },
    }),
    file('index.js', 'console.log("index")'),
    file('another.js', 'console.log("another")'),
  ])

  await build(false)

  const files = listFilesMatching('**/*.js', dist)

  // Multiple entry files merged into single bundle.
  expect(files.length).toBe(2)

  const mainJsContents = contentsForFilesMatching('main.*.js', dist)[0].contents
  const anotherJsContents = contentsForFilesMatching('another.*.js', dist)[0].contents

  expect(mainJsContents).toContain('"index"')
  expect(mainJsContents).not.toContain('"another"')

  expect(anotherJsContents).not.toContain('"index"')
  expect(anotherJsContents).toContain('"another"')
})

test('Entries are normalized and filtered.', async () => {
  const { dist } = prepare([
    packageJson('entry-array', {
      papua: { entry: ['./index.js', 'index.js', join(process.cwd(), 'index.js')] },
    }),
    file('index.js', 'console.log("index")'),
  ])

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  // NOTE rspack also handles this, normalizing and removing duplicates theoretically not necessary.
  expect((mainJsContents.match(/"index"/g) || []).length).toBe(1)
})

test('Can render React JSX.', async () => {
  const { dist } = prepare([
    packageJson('jsx', { dependencies: { react: 'latest' } }),
    file('index.jsx', 'export default () => <p>hey</p>'),
  ])

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain('createElement')
  expect(mainJsContents).not.toContain('<p>')
})

test('Can render React without JSX entry.', async () => {
  const { dist } = prepare([
    packageJson('jsx', { dependencies: { react: 'latest' } }),
    file('index.js', `import 'component.jsx'`),
    file('component.jsx', 'export default () => <p>hey</p>'),
  ])

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain('createElement')
  expect(mainJsContents).not.toContain('<p>')
})
