import { existsSync } from 'fs'
import { join } from 'path'
import { test, expect, beforeEach } from 'vitest'
import {
  environment,
  prepare,
  packageJson,
  file,
  listFilesMatching,
  contentsForFilesMatching,
  readFile,
  json,
  writeFile,
} from 'jest-fixture'
import { build, configure } from '../index'
import { refresh } from '../utility/helper'
import { writeConfiguration } from '../utility/configuration'

// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
const [_, setCwd] = environment('build')

beforeEach(refresh)

const pngLogo = {
  name: 'logo.load.png',
  copy: 'test/asset/logo.png',
}

test('Builds without errors.', async () => {
  const { dist } = prepare([packageJson('build'), file('index.js', `console.log('test')`)])

  await build(false)

  expect(existsSync(dist)).toBe(true)
  expect(existsSync(join(dist, 'index.html'))).toBe(true)

  // JS for main chunk is available.
  expect(listFilesMatching('*.js', dist).length).toBe(1)
  // No source map in production.
  expect(listFilesMatching('*.js.map', dist).length).toBe(0)
  // No favicon by default.
  expect(listFilesMatching('**/*.png', dist).length).toBe(0)
})

test('Works with TypeScript.', async () => {
  const { dist } = prepare([packageJson('build-ts'), file('index.ts', `console.log('test')`)])

  writeFile(
    'node_modules/papua/configuration/.prettierignore',
    readFile('../../../configuration/.prettierignore'),
  )
  writeFile(
    'node_modules/papua/configuration/template.html',
    readFile('../../../configuration/template.html'),
  )

  await configure() // Required for tsconfig.json
  await build(false)

  expect(existsSync(dist)).toBe(true)
  expect(existsSync(join(dist, 'index.html'))).toBe(true)
})

test('Source map support can be enabled for production.', async () => {
  const { dist } = prepare([
    packageJson('build-source', { papua: { sourceMap: true } }),
    file('index.js', `console.log('test')`),
  ])

  await build(false)

  expect(existsSync(dist)).toBe(true)
  expect(existsSync(join(dist, 'index.html'))).toBe(true)

  // JS for main chunk is available.
  expect(listFilesMatching('*.js', dist).length).toBe(1)
  // Source map enabled.
  expect(listFilesMatching('*.js.map', dist).length).toBe(1)
})

test('Builds without errors in development mode.', async () => {
  const { dist } = prepare([
    packageJson('build-development'),
    file('index.js', `console.log('test')`),
  ])

  await build(true)

  expect(existsSync(dist)).toBe(true)
  expect(existsSync(join(dist, 'index.html'))).toBe(true)

  // JS for main chunk is available.
  expect(listFilesMatching('*.js', dist).length).toBe(1)
  // No favicon by default.
  expect(listFilesMatching('**/*.png', dist).length).toBe(0)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents
  // Bundle contains inlined source map.
  expect(mainJsContents).toContain('sourceMappingURL=data:application/json')
})

test('No public path applied properly in bundle.', async () => {
  const { dist } = prepare([
    packageJson('publicpath'),
    file(
      'index.js',
      `import rootLogo from 'logo.load.png'; import logo from 'nested/logo.load.png'; console.log(rootLogo, logo)`,
    ),
    {
      name: 'logo.load.png',
      copy: 'test/asset/logo.png',
    },
    {
      name: 'nested/logo.load.png',
      copy: 'test/asset/logo.png',
    },
  ])

  await build(true)

  expect(existsSync(dist)).toBe(true)
  expect(existsSync(join(dist, 'index.html'))).toBe(true)

  const htmlContents = readFile(join(dist, 'index.html'))
  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents
  const mainJsName = listFilesMatching('*.js', dist)[0]
  const rootPngName = listFilesMatching('*.png', dist)[0]
  const pngName = listFilesMatching('nested/*.png', dist)[0]

  // Proper path to main bundle.
  expect(htmlContents).toContain(`src="${mainJsName}"`)
  // Proper path to logo.
  expect(mainJsContents).toContain(`"./${rootPngName}"`)
  expect(mainJsContents).toContain(`"./${pngName}"`)
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
  const pngName = listFilesMatching('*.png', dist)[0]

  // Proper path to main bundle.
  expect(htmlContents).toContain(`src=/${mainJsName}`)
  // Proper path to logo, public path programmatically added only once.
  expect(mainJsContents).toContain(`"${pngName}"`)
  // TODO JavaScript should not contain backslash on windows...
  expect(mainJsContents).toContain(`"/"`)
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

  // Proper path to main bundle.
  expect(htmlContents).toContain(`src=${path}/${mainJsName}`)
  // Proper path to logo, public path programmatically added only once.
  expect(mainJsContents).toContain(`"${path}/"`)
  expect(mainJsContents).toContain(`"${pngName}"`)
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
      papua: { html: { template: 'custom.html', title } },
    }),
    file('index.js', ''),
    file(
      'custom.html',
      `<!DOCTYPE html>
<html>
  <body>
    <p>${loadingMessage}</p>
  </body>
</html>`,
    ),
  ])

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))

  // Custom user template is used.
  expect(htmlContents).toContain(title)
  expect(htmlContents).toContain('<title>')
  expect(htmlContents).toContain(loadingMessage)
  expect(htmlContents).not.toContain('width=device-width')
})

test('Html template has no default title injected if set to false.', async () => {
  const { dist } = prepare([
    packageJson('custom-template', {
      papua: { html: { template: 'nested/custom.html', title: false } },
    }),
    file('index.js', ''),
    file(
      'nested/custom.html',
      `<!DOCTYPE html>
<html>
  <body>
  </body>
</html>`,
    ),
  ])

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))

  // Custom user template is used.
  expect(htmlContents).not.toContain('custom-template App')
  expect(htmlContents).not.toContain('<title>')
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
  const { dist } = prepare([
    packageJson('favicons'),
    file('index.js', ''),
    {
      name: 'logo.png',
      copy: 'test/asset/logo.png',
    },
  ])

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(dist, 'index.html'))
  const imageFiles = listFilesMatching('**/*.png', '.')

  // Favicon is injected.
  expect(htmlContents).toContain('<link rel=icon href=logo.png>')
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

  expect(htmlContents).toContain(`<link rel=icon href=nested/hello.png>`)
  expect(imageFiles).toContain('dist/nested/hello.png')
})

test('External favicon is copied to root.', async () => {
  const { dist } = prepare([
    packageJson('external-favicon', { papua: { icon: '../logo.png' } }),
    file('index.js', ''),
    {
      name: '../logo.png',
      copy: 'test/asset/logo.png',
    },
  ])

  await build(false)

  const htmlContents = readFile(join(dist, 'index.html'))
  const imageFiles = listFilesMatching('**/*.png', '.')

  expect(htmlContents).toContain('<link rel=icon href=logo.png>')
  expect(imageFiles).toContain('dist/logo.png')
})

test('External favicon will not override existing images.', async () => {
  const { dist } = prepare([
    packageJson('external-favicon', { papua: { icon: '../hello-favicon.png' } }),
    file('index.js', ''),
    {
      name: '../hello-favicon.png',
      copy: 'test/asset/logo.png',
    },
    file('hello-favicon.png', 'empty'),
  ])

  await build(false)

  const htmlContents = readFile(join(dist, 'index.html'))
  const imageFiles = listFilesMatching('**/*.png', '.')

  expect(htmlContents).toContain('<link rel=icon href=hello-favicon.png>')
  expect(imageFiles).toContain('dist/hello-favicon.png')
  // Existing icon will be used.
  expect(readFile('dist/hello-favicon.png')).toContain('empty')
})

test('Favicon can be disabled.', async () => {
  const { dist } = prepare([
    packageJson('custom-favicon', { papua: { icon: false } }),
    file('index.js', ''),
  ])

  await build(false)

  const htmlContents = readFile(join(dist, 'index.html'))
  const imageFiles = listFilesMatching('**/*.png', dist)

  expect(htmlContents).not.toContain('<link rel=icon')
  expect(imageFiles.length).toBe(0)
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
  expect(listFilesMatching('*.css.map', dist).length).toEqual(0)

  // Minified in production.
  expect(cssContents).toContain('background:red')
  // CSS file injected into HTML template.
  expect(htmlContents).toContain(`href=${cssFileName}`)
  expect(htmlContents).toContain('rel=stylesheet')
})

test('Can import CSS in development mode.', async () => {
  const { dist } = prepare([
    packageJson('build'),
    file('index.js', `import './index.css'`),
    file('index.css', 'body { background: red; }'),
  ])

  await build(true)

  expect(listFilesMatching('*.css', dist).length).toEqual(1)
  // CSS unchanged in development.
  expect(listFilesMatching('*.css.map', dist).length).toEqual(0)
})

test('Can import CSS with source map.', async () => {
  const { dist } = prepare([
    packageJson('build', { papua: { sourceMap: true } }),
    file('index.js', `import './index.css'`),
    file('index.css', 'body { background: red; }'),
  ])

  await build(false)

  expect(listFilesMatching('*.css', dist).length).toEqual(1)
  expect(listFilesMatching('*.css.map', dist).length).toEqual(1)
})

test('Can import JSON.', async () => {
  const { dist } = prepare([
    packageJson('build'),
    file(
      'index.js',
      `import content from './index.json'; import { hello } from './index.json'; console.log(content, hello)`,
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
    file('service-worker.js', 'console.log("worker", self.INJECT_MANIFEST_PLUGIN)'),
  ])

  await build(false)

  const files = listFilesMatching('**/*', dist)

  expect(files).toContain('service-worker.js')

  expect(readFile('dist/index.html')).not.toContain('service-worker')
  expect(readFile('dist/service-worker.js')).not.toContain('self.INJECT_MANIFEST_PLUGIN')
})

test('Inject manifest plugin can be disabled.', async () => {
  const { dist } = prepare([
    packageJson('build', {
      papua: {
        entry: { main: 'index.js', 'my-worker': 'service-worker.js' },
        injectManifest: false,
      },
    }),
    file('index.js', 'console.log("hey")'),
    file('service-worker.js', 'console.log("worker", self.INJECT_MANIFEST_PLUGIN)'),
  ])

  await build(false)

  const files = listFilesMatching('**/*', dist)

  expect(files).not.toContain('service-worker.js')
  expect(readFile('dist/index.html')).toContain('my-worker')

  const contents = contentsForFilesMatching('my-worker*.js', dist)

  expect(contents[0].contents).toContain('self.INJECT_MANIFEST_PLUGIN')
})

test('Service Worker entry location and chunk name can be configured.', async () => {
  const { dist } = prepare([
    packageJson('build', {
      papua: {
        injectManifest: { file: './my-worker.ts', chunkName: 'some-worker' },
      },
    }),
    file('index.js', 'console.log("hey")'),
    file('my-worker.ts', 'console.log("worker", self.INJECT_MANIFEST_PLUGIN)'),
  ])

  await build(false)

  const files = listFilesMatching('**/*', dist)

  expect(files).toContain('some-worker.js')
  expect(readFile('dist/index.html')).not.toContain('some-worker')

  const contents = contentsForFilesMatching('some-worker*.js', dist)

  expect(contents[0].contents).not.toContain('self.INJECT_MANIFEST_PLUGIN')
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
      `import somethang from 'somethang'; import anotherthang from 'anotherthang'; console.log(somethang, anotherthang)`,
    ),
  ])

  writeFile(
    'node_modules/papua/configuration/.prettierignore',
    readFile('../../../configuration/.prettierignore'),
  )
  writeFile(
    'node_modules/papua/configuration/template.html',
    readFile('../../../configuration/template.html'),
  )

  await writeConfiguration(false)
  await writeConfiguration(false) // Can be run multiple times.

  // NOTE symlinks only work when CMD run as administrator on Windows.
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

test('localDependencies also work with TypeScript and ES Modules.', async () => {
  const { dist } = prepare([
    packageJson('local-dependencies', {
      type: 'module',
      localDependencies: {
        local: '../local',
      },
    }),
    json('../local/package.json', {
      name: 'local-dependency',
      type: 'module',
      main: './dist/index.js',
      exports: {
        '.': {
          import: {
            default: './dist/index.js',
          },
        },
      },
    }),
    file('../local/dist/index.js', 'export const localDependency = () => "local-dependency"'),
    // Ensure node_modules exist (which is the case on postinstall).
    json('node_modules/installed/package.json', { name: 'installed' }),
    // Imports symlinked modules.
    file('index.ts', `import { localDependency } from 'local'; console.log(localDependency())`),
  ])

  writeFile(
    'node_modules/papua/configuration/.prettierignore',
    readFile('../../../configuration/.prettierignore'),
  )
  writeFile(
    'node_modules/papua/configuration/template.html',
    readFile('../../../configuration/template.html'),
  )

  await writeConfiguration(false)

  const files = listFilesMatching('**/*', '.')
  const somethangIndexContents = readFile('node_modules/local/dist/index.js')

  expect(files).toContain('node_modules/local/package.json')
  expect(files).toContain('node_modules/local/dist/index.js')
  expect(somethangIndexContents).toContain('"local-dependency"')

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain('"local-dependency"')
})

test('localDependencies work when importing horizontally (even with cycles).', async () => {
  prepare([
    packageJson('higher', {
      type: 'module',
      main: './index.js',
      exports: {
        '.': {
          import: {
            default: './index.js',
          },
        },
      },
    }),
    json('base/package.json', {
      name: 'base',
      type: 'module',
      localDependencies: {
        higher: '..',
        lower: './lower',
      },
    }),
    json('base/lower/package.json', {
      name: 'lower',
      type: 'module',
      main: './index.js',
      exports: {
        '.': {
          import: {
            default: './index.js',
          },
        },
      },
    }),
    file('index.js', 'export const higherDependency = () => "higher-dependency"'),
    file('base/lower/index.js', 'export const lowerDependency = () => "lower-dependency"'),
    // Ensure node_modules exist (which is the case on postinstall).
    json('base/node_modules/installed/package.json', { name: 'installed' }),
    // Imports symlinked modules.
    file(
      'base/index.ts',
      `import { higherDependency } from 'higher'; import { lowerDependency } from 'lower'; console.log(higherDependency(), lowerDependency())`,
    ),
  ])

  writeFile(
    'node_modules/papua/configuration/.prettierignore',
    readFile('../../../configuration/.prettierignore'),
  )
  writeFile(
    'node_modules/papua/configuration/template.html',
    readFile('../../../configuration/template.html'),
  )

  writeFile(
    'base/node_modules/papua/configuration/.prettierignore',
    readFile('../../../configuration/.prettierignore'),
  )
  writeFile(
    'base/node_modules/papua/configuration/template.html',
    readFile('../../../configuration/template.html'),
  )

  setCwd(join(process.cwd(), 'base'))
  refresh()

  await writeConfiguration(false)

  expect(existsSync(join(process.cwd(), 'node_modules/higher/package.json'))).toBe(true)
  expect(existsSync(join(process.cwd(), 'node_modules/lower/package.json'))).toBe(true)
  expect(existsSync(join(process.cwd(), 'tsconfig.json'))).toBe(true)

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', 'dist')[0].contents

  expect(mainJsContents).toContain('"higher-dependency"')
  expect(mainJsContents).toContain('"lower-dependency"')
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
    file('index.js', `import Component from 'component.jsx'; console.log(Component)`),
    file('component.jsx', 'export default () => <p>hey</p>'),
  ])

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain('createElement')
  expect(mainJsContents).not.toContain('<p>')
})

test('Can import node modules.', async () => {
  const { dist } = prepare([
    packageJson('module'),
    file('index.js', `import 'my-module';`),
    file('node_modules/my-module/index.js', `console.log('hello');`),
  ])

  await build(false)

  expect(existsSync(dist)).toEqual(true)

  const jsContents = contentsForFilesMatching('*.js', dist)

  expect(jsContents.length).toEqual(1)

  // Module found in dist file.
  expect(jsContents[0].contents).toContain('hello')
})

test('Works with ES Module packages.', async () => {
  const { dist } = prepare([
    packageJson('esmodule'),
    file('index.js', `import 'my-module';`),
    file('node_modules/my-module/index.js', `import 'my-imported-module'`),
    file('node_modules/my-imported-module/index.js', `export default console.log('hello again')`),
  ])

  await build(false)

  expect(existsSync(dist)).toEqual(true)

  const jsContents = contentsForFilesMatching('*.js', dist)

  // Contents of imported module imported are found in bundle.
  expect(jsContents[0].contents).toContain('hello again')
})

test('Tree-shaking is applied to ES Modules.', async () => {
  const { dist } = prepare([
    packageJson('treeshaking'),
    file('index.js', `import { hello } from 'my-module'; console.log(hello)`),
    file(
      'node_modules/my-module/index.js',
      `export default 'remove-me'
  export const hello = 'keep-me'
  export const world = 'remove-me'`,
    ),
  ])

  await build(false)

  expect(existsSync(dist)).toEqual(true)

  const jsContents = contentsForFilesMatching('*.js', dist)

  // Contents of imported module imported are found in bundle.
  expect(jsContents[0].contents).toContain('keep-me')
  expect(jsContents[0].contents).not.toContain('remove-me')
})

test('Older syntax is not transformed by default.', async () => {
  const { dist } = prepare([
    packageJson('build-default'),
    file(
      'index.js',
      `const first = { hello: 'world' }; console.log('merge', { ...first, ...first }, first?.hello, first.id ||= 1)`,
    ),
  ])

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain('...')
  expect(mainJsContents).toContain('?.')
  expect(mainJsContents).toContain('||=')
})

test('Code is transformed to specified ECMSScript version.', async () => {
  const { dist } = prepare([
    packageJson('build-es-version', { papua: { esVersion: 'es5' } }),
    file(
      'index.js',
      `const first = { hello: 'world' }; console.log('merge', { ...first, ...first }, first?.hello)`,
    ),
  ])

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).not.toContain('...')
  expect(mainJsContents).toContain('Object.getOwnPropertySymbols') // Polyfill
  expect(mainJsContents).not.toContain('?.')
})

test('Code is transformed according to ES version derived from browserslist.', async () => {
  const { dist } = prepare([
    packageJson('build-es-version', {
      papua: {
        esVersion: 'browserslist',
      },
      browserslist: ['> 1%', 'last 3 versions', 'not dead', 'IE 11'],
    }),
    file(
      'index.js',
      `const first = { hello: 'world' }; console.log('merge', { ...first, ...first })`,
    ),
  ])

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).not.toContain('...')
})

test('Code is transformed according to ES version derived from browserslist.', async () => {
  const { dist } = prepare([
    packageJson('build-es-version-file', {
      papua: {
        esVersion: 'browserslist',
      },
    }),
    file(
      'index.js',
      `const first = { hello: 'world' }; console.log('merge', { ...first, ...first })`,
    ),
    file('.browserslistrc', `IE 11`),
  ])

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).not.toContain('...')
})

test('Builds multiple times with customized output.', async () => {
  prepare([
    packageJson('build-custom-output', { papua: { output: 'public' } }),
    file('index.js', `console.log('test')`),
  ])

  const dist = join(process.cwd(), 'public')

  // Rspack will fail if file with same hash is emitted again, build cleans output first.
  await build(false)
  await build(false)

  expect(existsSync(dist)).toBe(true)
  expect(existsSync(join(dist, 'index.html'))).toBe(true)

  // JS for main chunk is available.
  expect(listFilesMatching('*.js', dist).length).toBe(1)
  // No source map in production.
  expect(listFilesMatching('*.js.map', dist).length).toBe(0)
  // No favicon by default.
  expect(listFilesMatching('**/*.png', dist).length).toBe(0)
})

test('Can import fonts.', async () => {
  const { dist } = prepare([
    packageJson('build-font'),
    file('index.js', `import tobua from 'tobua'; console.log(tobua)`),
  ])

  await build(false)

  expect(listFilesMatching('*.woff2', dist).length).toBe(1)

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents
  expect(mainJsContents).toContain('.woff2')
})
