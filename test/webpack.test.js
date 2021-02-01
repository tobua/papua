import { existsSync } from 'fs'
import { join } from 'path'
import glob from 'fast-glob'
import { build } from '../index.js'
import { readFile } from './utility/file.js'
import { environment, prepare } from './utility/prepare.js'
import {
  packageJson,
  javaScriptFile,
  pngLogo,
  indexJavaScript,
} from './utility/structures.js'

const [fixturePath] = environment('webpack')

test('Can disable html template.', async () => {
  const disableHtmlPluginStructure = [
    packageJson('disable-template', {
      html: false,
    }),
    indexJavaScript(`console.log('test')`),
  ]
  prepare(disableHtmlPluginStructure, fixturePath)

  await build()

  const distFolder = join(fixturePath, 'dist')

  expect(existsSync(distFolder)).toEqual(true)
  expect(existsSync(join(distFolder, 'index.html'))).toEqual(false)
})

const webpackConfigMultipleBuilds = `import { join } from 'path'

export default (configuration, development) => ([
    {
        output: {
            path: join(process.cwd(), 'web/dist')
        }
    },
    {
        entry: {
            extension: {
                import: 'extension.js',
            }
        },
        html: false,
        output: {
            path: join(process.cwd(), 'extension/dist')
        }
    },
    {
        entry: {
            blog: {
                import: 'blog.js',
            }
        },
        output: {
            path: join(process.cwd(), 'blog/dist'),
            publicPath: 'our/blog/'
        }
    }
])`

test('Multiple builds with different output locations.', async () => {
  const multipleBuildsStructure = [
    packageJson('multiple-builds', {
      entry: 'web.js',
    }),
    javaScriptFile('webpack.config.js', webpackConfigMultipleBuilds),
    javaScriptFile('web.js', `console.log('web')`),
    javaScriptFile('extension.js', `console.log('extension')`),
    javaScriptFile(
      'blog.js',
      `import logo from 'logo.png'; console.log('blog', logo)`
    ),
    pngLogo,
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

  // Check public path.
  const mainJs = glob.sync(['*.js'], {
    cwd: distFolderBlog,
  })

  const logo = glob.sync(['*.png'], {
    cwd: distFolderBlog,
  })

  const htmlContents = readFile(join(distFolderBlog, 'index.html'))
  const mainJsContents = readFile(join(distFolderBlog, mainJs[0]))

  // Proper path to main bundle.
  expect(htmlContents).toContain(`src="our/blog/${mainJs[0]}"`)
  // Proper path to logo.
  expect(mainJsContents).toContain(`"our/blog/${logo[0]}"`)
})
