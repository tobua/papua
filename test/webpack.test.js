import { existsSync } from 'fs'
import { join } from 'path'
import { build } from '../index.js'
import { readFile } from './utility/file.js'
import { environment, prepare } from './utility/prepare.js'
import {
  packageJson,
  javaScriptFile,
  pngLogo,
  indexJavaScript,
  anyFile,
} from './utility/structures.js'
import {
  listFilesMatching,
  contentsForFilesMatching,
} from './utility/helper.js'
import { loadWebpackConfig } from '../utility/configuration.js'

const [fixturePath] = environment('webpack')

const webpackConfig = {
  __esModule: true,
  default: {},
}

test('Can disable html template.', async () => {
  const disableHtmlPluginStructure = [
    packageJson('disable-template', {
      html: false,
    }),
    indexJavaScript(`console.log('test')`),
  ]
  const { dist } = prepare(disableHtmlPluginStructure, fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(false)
})

test('Multiple builds with different output locations.', async () => {
  // Virtual mock, so that file doesn't necessarly have to exist.
  jest.doMock(join(fixturePath, 'webpack.config.js'), () => webpackConfig, {
    virtual: true,
  })

  const multipleBuildsStructure = [
    packageJson('multiple-builds', {
      entry: 'web.js',
    }),
    javaScriptFile('web.js', `console.log('web')`),
    javaScriptFile('extension.js', `console.log('extension')`),
    javaScriptFile(
      'blog.js',
      `import logo from 'logo.png'; console.log('blog', logo)`
    ),
    pngLogo,
  ]

  webpackConfig.default = [
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
      html: false,
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
      output: {
        path: join(fixturePath, 'blog/dist'),
        publicPath: 'our/blog/',
      },
    },
  ]

  prepare(multipleBuildsStructure, fixturePath)

  await build()

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
  expect(jsContents[0].contents).toContain(`"our/blog/${imageFiles[0]}"`)
})

test('User can add loaders and plugins.', async () => {
  // Virtual mock, so that file doesn't necessarly have to exist.
  jest.doMock(join(fixturePath, 'webpack.config.js'), () => webpackConfig, {
    virtual: true,
  })

  const loaderPluginMergeStructure = [
    packageJson('loader-plugin-merge'),
    indexJavaScript(),
  ]

  prepare(loaderPluginMergeStructure, fixturePath)

  // Mocking import manually, as filesystem import is cached and filechanges not reflected.
  webpackConfig.default = {}

  const [initialConfiguration] = await loadWebpackConfig(true)

  const initialPluginCount = initialConfiguration.plugins.length
  const initialRulesCount = initialConfiguration.module.rules.length

  prepare(loaderPluginMergeStructure, fixturePath)

  // Reset previous imports/mocks.
  webpackConfig.default = {
    module: {
      rules: [
        {
          test: /\.svg$/,
          loader: 'my-loader',
        },
      ],
    },
    plugins: [() => {}],
  }

  const [configuration] = await loadWebpackConfig(true)

  const pluginCount = configuration.plugins.length
  const rulesCount = configuration.module.rules.length

  // New plugin and loader is present.
  expect(pluginCount - 1).toEqual(initialPluginCount)
  expect(rulesCount - 1).toEqual(initialRulesCount)
})

test('Custom plugins and loaders can be used.', async () => {
  // Virtual mock, so that file doesn't necessarly have to exist.
  jest.doMock(join(fixturePath, 'webpack.config.js'), () => webpackConfig, {
    virtual: true,
  })

  const newContents = 'empty now'

  const customLoaderPluginStructure = [
    packageJson('custom-loader-and-plugin', {}, { type: 'module' }),
    indexJavaScript(`import icon from 'icon.svg'; console.log(icon)`),
    anyFile('icon.svg', 'iconista'),
    anyFile(
      'loader.js',
      `export default function MyLoader(content) {
  // This will be the return value of the import.
  return \`export default '${newContents}'\`
}`
    ),
  ]

  const { dist } = prepare(customLoaderPluginStructure, fixturePath)

  const pluginMock = jest.fn()

  class MyPlugin {
    // eslint-disable-next-line class-methods-use-this
    apply(compiler) {
      compiler.hooks.run.tap('my-plugin', pluginMock)
    }
  }

  webpackConfig.after = (configuration) => {
    configuration.module.rules.splice(2, 1)
    return configuration
  }

  // Reset previous imports/mocks.
  webpackConfig.default = {
    module: {
      rules: [
        {
          test: /\.svg$/,
          use: {
            loader: join(fixturePath, 'loader.js'),
          },
        },
      ],
    },
    plugins: [new MyPlugin()],
  }

  await build()

  expect(existsSync(dist)).toEqual(true)

  // Plugin hook was called.
  expect(pluginMock).toHaveBeenCalled()

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain(newContents)

  delete webpackConfig.after
})
