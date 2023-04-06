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
import { loadWebpackConfig } from '../utility/configuration'
import { refresh } from '../utility/helper'

registerVitest(beforeEach, afterEach, vi)

const [fixturePath] = environment('webpack')

beforeEach(refresh)

const webpackConfig = {
  __esModule: true,
  default: {},
}

test('Can disable html template.', async () => {
  const disableHtmlPluginStructure = [
    packageJson('disable-template', {
      papua: {
        html: false,
      },
    }),
    file('index.js', `console.log('test')`),
  ]
  const { dist } = prepare(disableHtmlPluginStructure, fixturePath)

  await build(false)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(false)
})

test('Can use absolute and relative imports.', async () => {
  const disableHtmlPluginStructure = [
    packageJson('various-imports'),
    file(
      'index.js',
      `import 'absolute.js';
import './relative.js';

console.log('index')`
    ),
    file('absolute.js', `console.log('absolute')`),
    file('relative.js', `console.log('relative')`),
  ]
  const { dist } = prepare(disableHtmlPluginStructure, fixturePath)

  await build(false)

  const jsContents = contentsForFilesMatching('*.js', dist)

  expect(jsContents.length).toBe(1)
  expect(jsContents[0].contents).toContain('"index"')
  expect(jsContents[0].contents).toContain('"absolute"')
  expect(jsContents[0].contents).toContain('"relative"')
})

// test('Multiple builds with different output locations.', async () => {
//   // Virtual mock, so that file doesn't necessarly have to exist.
//   jest.doMock(join(fixturePath, 'webpack.config.js'), () => webpackConfig, {
//     virtual: true,
//   })

//   webpackConfig.default = [
//     {
//       output: {
//         path: join(fixturePath, 'web/dist'),
//       },
//     },
//     {
//       entry: {
//         extension: {
//           import: 'extension.js',
//         },
//       },
//       html: false,
//       output: {
//         path: join(fixturePath, 'extension/dist'),
//       },
//     },
//     {
//       entry: {
//         blog: {
//           import: 'blog.js',
//         },
//       },
//       output: {
//         path: join(fixturePath, 'blog/dist'),
//         publicPath: 'our/blog/',
//       },
//     },
//   ]

//   prepare([
//     packageJson('multiple-builds', {
//       papua: {
//         entry: 'web.js',
//       },
//     }),
//     file('web.js', `console.log('web')`),
//     file('extension.js', `console.log('extension')`),
//     file('blog.js', `import logo from 'logo.png'; console.log('blog', logo)`),
//     {
//       name: 'logo.png',
//       copy: 'test/asset/logo.png',
//     },
//   ])

//   await build()

//   const distFolderWeb = join(fixturePath, 'web/dist')
//   const distFolderExtension = join(fixturePath, 'extension/dist')
//   const distFolderBlog = join(fixturePath, 'blog/dist')

//   expect(existsSync(distFolderWeb)).toEqual(true)
//   expect(existsSync(distFolderExtension)).toEqual(true)
//   expect(existsSync(distFolderBlog)).toEqual(true)
//   expect(existsSync(join(distFolderWeb, 'index.html'))).toEqual(true)
//   expect(existsSync(join(distFolderExtension, 'index.html'))).toEqual(false)
//   expect(existsSync(join(distFolderBlog, 'index.html'))).toEqual(true)

//   const htmlContents = readFile(join(distFolderBlog, 'index.html'))
//   const jsContents = contentsForFilesMatching('*.js', distFolderBlog)
//   const imageFiles = listFilesMatching('*.png', distFolderBlog)

//   // Check public path.
//   expect(htmlContents).toContain(`src="our/blog/${jsContents[0].name}"`)
//   expect(jsContents[0].contents).toContain(`"our/blog/${imageFiles[0]}"`)
// })

// test('User can add loaders and plugins.', async () => {
//   // Virtual mock, so that file doesn't necessarly have to exist.
//   jest.doMock(join(fixturePath, 'webpack.config.js'), () => webpackConfig, {
//     virtual: true,
//   })

//   const loaderPluginMergeStructure = [packageJson('loader-plugin-merge'), file('index.js', '')]

//   prepare(loaderPluginMergeStructure, fixturePath)

//   // Mocking import manually, as filesystem import is cached and filechanges not reflected.
//   webpackConfig.default = {}

//   const [initialConfiguration] = await loadWebpackConfig(true)

//   const initialPluginCount = initialConfiguration.plugins.length
//   const initialRulesCount = initialConfiguration.module.rules.length

//   prepare(loaderPluginMergeStructure, fixturePath)

//   // Reset previous imports/mocks.
//   webpackConfig.default = {
//     module: {
//       rules: [
//         {
//           test: /\.svg$/,
//           loader: 'my-loader',
//         },
//       ],
//     },
//     plugins: [() => {}],
//   }

//   const [configuration] = await loadWebpackConfig(true)

//   const pluginCount = configuration.plugins.length
//   const rulesCount = configuration.module.rules.length

//   // New plugin and loader is present.
//   expect(pluginCount - 1).toEqual(initialPluginCount)
//   expect(rulesCount - 1).toEqual(initialRulesCount)
// })

// test('Custom plugins and loaders can be used.', async () => {
//   // Virtual mock, so that file doesn't necessarly have to exist.
//   jest.doMock(join(fixturePath, 'webpack.config.js'), () => webpackConfig, {
//     virtual: true,
//   })

//   const newContents = 'empty now'

//   const customLoaderPluginStructure = [
//     packageJson('custom-loader-and-plugin', { type: 'module' }),
//     file('index.js', `import icon from 'icon.svg'; console.log(icon)`),
//     file('icon.svg', 'iconista'),
//     file(
//       'loader.js',
//       `export default function MyLoader(content) {
//   // This will be the return value of the import.
//   return \`export default '${newContents}'\`
// }`
//     ),
//   ]

//   const { dist } = prepare(customLoaderPluginStructure, fixturePath)

//   const pluginMock = jest.fn()

//   class MyPlugin {
//     // eslint-disable-next-line class-methods-use-this
//     apply(compiler) {
//       compiler.hooks.run.tap('my-plugin', pluginMock)
//     }
//   }

//   webpackConfig.after = (configuration) => {
//     configuration.module.rules.splice(1, 1)
//     return configuration
//   }

//   // Reset previous imports/mocks.
//   webpackConfig.default = {
//     module: {
//       rules: [
//         {
//           test: /\.svg$/,
//           use: {
//             loader: join(fixturePath, 'loader.js'),
//           },
//         },
//       ],
//     },
//     plugins: [new MyPlugin()],
//   }

//   await build()

//   expect(existsSync(dist)).toEqual(true)

//   // Plugin hook was called.
//   expect(pluginMock).toHaveBeenCalled()

//   const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

//   expect(mainJsContents).toContain(newContents)

//   delete webpackConfig.after
// })
