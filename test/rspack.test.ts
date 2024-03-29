import { existsSync } from 'fs'
import { join } from 'path'
import { test, expect, afterEach, vi } from 'vitest'
import {
  environment,
  prepare,
  packageJson,
  file,
  contentsForFilesMatching,
  readFile,
  listFilesMatching,
} from 'jest-fixture'
import { Compiler, HtmlRspackPlugin } from '@rspack/core'
import { createRspackConfig } from './utility/configuration'
import { build } from '../index'
import { loadRspackConfig } from '../utility/configuration'

const [fixturePath] = environment('webpack')

afterEach(() => {
  vi.resetModules()
})

const rspackConfig = createRspackConfig()

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

console.log('index')`,
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

test('User can add their own rspack configuration file.', async () => {
  // Virtual mock, so that file doesn't necessarly have to exist.
  vi.doMock(join(fixturePath, 'rspack.config.js'), () => rspackConfig)

  const loaderPluginMergeStructure = [packageJson('loader-plugin-merge'), file('index.js', '')]

  prepare(loaderPluginMergeStructure, fixturePath)

  // Mocking import manually, as filesystem import is cached and filechanges not reflected.
  rspackConfig.default = {}

  const initialConfigurations = await loadRspackConfig(true)

  expect(initialConfigurations[0].builtins?.treeShaking).toBeUndefined()

  prepare(loaderPluginMergeStructure, fixturePath)

  // Reset previous imports/mocks.
  rspackConfig.default = {
    builtins: {
      css: {
        namedExports: true,
      },
      treeShaking: true,
    },
  }

  const configurations = await loadRspackConfig(true)

  expect(configurations.length).toBe(1)
  expect(configurations[0].builtins?.treeShaking).toBe(true)
  expect(configurations[0].builtins?.css?.namedExports).toBe(true)
})

test(`Default export isn't required in custom configuration.`, async () => {
  // Virtual mock, so that file doesn't necessarly have to exist.
  vi.doMock(join(fixturePath, 'rspack.config.js'), () => rspackConfig)

  const loaderPluginMergeStructure = [packageJson('custom-configuration'), file('index.js', '')]

  prepare(loaderPluginMergeStructure, fixturePath)

  // Mocking import manually, as filesystem import is cached and filechanges not reflected.
  rspackConfig.default = {}

  const initialConfigurations = await loadRspackConfig(true)

  expect(initialConfigurations.length).toBe(1)

  prepare(loaderPluginMergeStructure, fixturePath)

  rspackConfig.after = (config) => {
    config.target = 'hello'
    return config
  }
  rspackConfig.default = undefined // NOTE vitest mock import will fail without default property present.

  const configurations = await loadRspackConfig(true)

  expect(configurations.length).toBe(1)
  expect(configurations[0].target).toBe('hello')
})

test('Multiple builds with different output locations.', async () => {
  vi.doMock(join(fixturePath, 'rspack.config.js'), () => rspackConfig)

  rspackConfig.default = [
    {
      output: {
        path: join(fixturePath, 'web/dist'),
      },
    },
    {
      entry: {
        extension: {
          import: 'extension.js',
        },
      },
      output: {
        path: join(fixturePath, 'extension/dist'),
      },
    },
    {
      entry: {
        blog: {
          import: 'blog.js',
        },
      },
      plugins: [
        new HtmlRspackPlugin({
          publicPath: 'our/blog/',
        }),
      ],
      output: {
        path: join(fixturePath, 'blog/dist'),
        publicPath: 'our/blog/',
      },
    },
  ]
  rspackConfig.after = undefined

  prepare([
    packageJson('multiple-builds', {
      papua: {
        entry: 'web.js',
      },
    }),
    file('web.js', `console.log('web')`),
    file('extension.js', `console.log('extension')`),
    file('blog.js', `import logo from 'logo.load.png'; console.log('blog', logo)`),
    {
      name: 'logo.load.png',
      copy: 'test/asset/logo.png',
    },
  ])

  await build(false)

  const distFolderWeb = join(fixturePath, 'web/dist')
  const distFolderExtension = join(fixturePath, 'extension/dist')
  const distFolderBlog = join(fixturePath, 'blog/dist')

  expect(existsSync(distFolderWeb)).toEqual(true)
  expect(existsSync(distFolderExtension)).toEqual(true)
  expect(existsSync(distFolderBlog)).toEqual(true)
  expect(existsSync(join(distFolderWeb, 'index.html'))).toEqual(true)
  expect(existsSync(join(distFolderExtension, 'index.html'))).toEqual(false)
  expect(existsSync(join(distFolderBlog, 'index.html'))).toEqual(true)

  const htmlContents = readFile(join(distFolderBlog, 'index.html'))
  const jsContents = contentsForFilesMatching('*.js', distFolderBlog)
  const imageFiles = listFilesMatching('*.png', distFolderBlog)

  // Check public path.
  expect(htmlContents).toContain(`src="our/blog/${jsContents[0].name}"`)
  expect(jsContents[0].contents).toContain(`"${imageFiles[0]}"`)
  expect(jsContents[0].contents).toContain(`"our/blog/"`)
})

test('User can add loaders and plugins.', async () => {
  vi.doMock(join(fixturePath, 'rspack.config.js'), () => rspackConfig)

  const loaderPluginMergeStructure = [packageJson('loader-plugin-merge'), file('index.js', '')]

  prepare(loaderPluginMergeStructure, fixturePath)

  // Mocking import manually, as filesystem import is cached and filechanges not reflected.
  rspackConfig.default = {}

  const [initialConfiguration] = await loadRspackConfig(true)

  const initialPluginCount = initialConfiguration.plugins?.length
  const initialRulesCount = initialConfiguration.module?.rules?.length

  prepare(loaderPluginMergeStructure, fixturePath)

  // Reset previous imports/mocks.
  rspackConfig.default = {
    module: {
      rules: [
        {
          test: /\.svg$/,
          use: {
            loader: 'my-loader',
          },
        },
      ],
    },
    plugins: [() => {}],
  }

  const [configuration] = await loadRspackConfig(true)

  const pluginCount = configuration.plugins?.length ?? 0
  const rulesCount = configuration.module?.rules?.length ?? 0

  // New plugin and loader is present.
  expect(pluginCount - 1).toEqual(initialPluginCount)
  expect(rulesCount - 1).toEqual(initialRulesCount)
})

test('Custom plugins and loaders can be used.', async () => {
  vi.doMock(join(fixturePath, 'rspack.config.js'), () => rspackConfig)

  const newContents = 'empty now'

  // TODO plugin import by rspack/core fails when using ESM and type="module" (worked in webpack)...
  const customLoaderPluginStructure = [
    packageJson('custom-loader-and-plugin'),
    file('index.js', `import icon from 'icon.fancy'; console.log(icon)`),
    file('icon.fancy', 'iconista'),
    file(
      'loader.js',
      `module.exports = function MyLoader(content) {
  // This will be the return value of the import.
  return \`export default '${newContents}'\`
}`,
    ),
  ]

  const { dist } = prepare(customLoaderPluginStructure, fixturePath)

  const pluginMock = vi.fn()

  class MyPlugin {
    // eslint-disable-next-line class-methods-use-this
    apply(compiler: Compiler) {
      compiler.hooks.run.tap('my-plugin', pluginMock)
    }
  }

  rspackConfig.after = (configuration) => {
    configuration.module.rules.splice(1, 1)
    return configuration
  }

  // Reset previous imports/mocks.
  rspackConfig.default = {
    module: {
      rules: [
        {
          test: /\.fancy$/,
          use: {
            loader: join(fixturePath, 'loader.js'),
          },
        },
      ],
    },
    plugins: [new MyPlugin()],
  }

  await build(false)

  expect(existsSync(dist)).toEqual(true)

  // Plugin hook was called.
  expect(pluginMock).toHaveBeenCalled()

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain(newContents)

  delete rspackConfig.after
})

test('Multiple html files can be generated with multiple configurations.', async () => {
  // Virtual mock, so that file doesn't necessarly have to exist.
  vi.doMock(join(fixturePath, 'rspack.config.js'), () => rspackConfig)

  const loaderPluginMergeStructure = [
    packageJson('multiple-html', { papua: { html: false } }),
    file('first.js', 'console.log("first")'),
    file('second.js', 'console.log("second")'),
    file('third.js', 'console.log("third")'),
  ]

  const { dist } = prepare(loaderPluginMergeStructure, fixturePath)

  // Reset previous imports/mocks.
  rspackConfig.default = () => [
    {
      entry: './first.js',
      devServer: {
        open: false,
      },
    },
    {
      entry: './second.js',
      plugins: [
        new HtmlRspackPlugin({
          filename: 'second.html',
        }),
      ],
    },
    {
      entry: './third.js',
      output: {
        path: join(fixturePath, 'dist/third'),
      },
      plugins: [
        new HtmlRspackPlugin({
          filename: 'third.html',
        }),
      ],
    },
  ]
  // Required for vitest mocking to work properly.
  rspackConfig.after = undefined

  const configuration = await loadRspackConfig(true)

  expect(configuration[0].devServer?.open).toBe(false)

  await build(false)

  expect(existsSync(dist)).toBe(true)
  expect(existsSync(join(dist, 'index.html'))).toBe(false)
  expect(existsSync(join(dist, 'second.html'))).toBe(true)
  expect(existsSync(join(dist, 'third/third.html'))).toBe(true)

  const jsFileContents = contentsForFilesMatching('**/*.js', dist)

  expect(jsFileContents.length).toBe(3)

  const contents = jsFileContents.map((inner) => inner.contents)

  const first = contents.filter((content) => content.includes('"first"'))
  const second = contents.filter((content) => content.includes('"second"'))
  const third = contents.filter((content) => content.includes('"third"'))

  expect(first?.length).toBe(1)
  expect(second?.length).toBe(1)
  expect(third?.length).toBe(1)
})
