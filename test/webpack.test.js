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
} from './utility/structures.js'
import {
  listFilesMatching,
  contentsForFilesMatching,
} from './utility/helper.js'
import { loadWebpackConfig } from '../utility/configuration.js'

const [fixturePath] = environment('webpack')

test('Can disable html template.', async () => {
  const disableHtmlPluginStructure = [
    packageJson('disable-template', {
      html: false,
    }),
    indexJavaScript(`console.log('test')`),
    // Need the file to be available, so that it can be mocked in tests below.
    javaScriptFile('webpack.config.js', ''),
  ]
  const { dist } = prepare(disableHtmlPluginStructure, fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(false)
})

test('Multiple builds with different output locations.', async () => {
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
    javaScriptFile('webpack.config.js', ''),
  ]
  prepare(multipleBuildsStructure, fixturePath)

  jest.resetModuleRegistry()
  jest.resetModules()
  jest.doMock(join(fixturePath, 'webpack.config.js'), () => () => [
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
  ])

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
  const loaderPluginMergeStructure = [
    packageJson('loader-plugin-merge', {}, { type: 'module' }),
    indexJavaScript(),
    javaScriptFile('webpack.config.js', ''),
  ]

  prepare(loaderPluginMergeStructure, fixturePath)

  jest.resetModuleRegistry()

  // Mocking import manually, as filesystem import is cached and filechanges not reflected.
  jest.resetModules()
  jest.doMock(join(fixturePath, 'webpack.config.js'), () => {})

  const [initialConfiguration] = await loadWebpackConfig(true)

  const initialPluginCount = initialConfiguration.plugins.length
  const initialRulesCount = initialConfiguration.module.rules.length

  prepare(loaderPluginMergeStructure, fixturePath)

  // Reset previous imports/mocks.
  jest.resetModules()
  jest.doMock(join(fixturePath, 'webpack.config.js'), () => ({
    module: {
      rules: [
        {
          test: /\\.svg$/,
          loader: 'my-loader',
        },
      ],
    },
    plugins: [() => {}],
  }))

  const [configuration] = await loadWebpackConfig(true)

  const pluginCount = configuration.plugins.length
  const rulesCount = configuration.module.rules.length

  // New plugin and loader is present.
  expect(pluginCount - 1).toEqual(initialPluginCount)
  expect(rulesCount - 1).toEqual(initialRulesCount)
})
