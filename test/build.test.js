import { existsSync } from 'fs'
import { join } from 'path'
import glob from 'fast-glob'
import { build } from '../index.js'
import { readFile } from './utility/file.js'
import { environment, prepare } from './utility/prepare.js'
import { packageJson, indexJavaScript, pngLogo } from './utility/structures.js'

const [fixturePath] = environment('build')

test('Builds without errors.', async () => {
  prepare('build', fixturePath)

  await build()

  const distFolder = join(fixturePath, 'dist')

  expect(existsSync(distFolder)).toEqual(true)
  expect(existsSync(join(distFolder, 'index.html'))).toEqual(true)

  const mainJs = glob.sync(['*.js'], {
    cwd: distFolder,
  })

  const mainJsMap = glob.sync(['*.js.map'], {
    cwd: distFolder,
  })

  // JS and map for main chunk are available.
  expect(mainJs.length).toEqual(1)
  expect(mainJsMap.length).toEqual(1)
})

test('No public path applied properly in bundle.', async () => {
  const noPublicPathStructure = [
    packageJson('publicpath'),
    indexJavaScript(`import logo from 'logo.png'; console.log(logo)`),
    pngLogo,
  ]

  prepare(noPublicPathStructure, fixturePath)

  await build()

  const distFolder = join(fixturePath, 'dist')

  expect(existsSync(distFolder)).toEqual(true)
  expect(existsSync(join(distFolder, 'index.html'))).toEqual(true)

  const mainJs = glob.sync(['*.js'], {
    cwd: distFolder,
  })

  const logo = glob.sync(['*.png'], {
    cwd: distFolder,
  })

  const htmlContents = readFile(join(distFolder, 'index.html'))
  const mainJsContents = readFile(join(distFolder, mainJs[0]))

  // Proper path to main bundle.
  expect(htmlContents).toContain(`src="${mainJs[0]}"`)
  // Proper path to logo.
  expect(mainJsContents).toContain(`"${logo[0]}"`)
})

test('Root public path applied properly in bundle.', async () => {
  const noPublicPathStructure = [
    packageJson('publicpath', { publicPath: '/' }),
    indexJavaScript(`import logo from 'logo.png'; console.log(logo)`),
    pngLogo,
  ]

  prepare(noPublicPathStructure, fixturePath)

  await build()

  const distFolder = join(fixturePath, 'dist')

  expect(existsSync(distFolder)).toEqual(true)
  expect(existsSync(join(distFolder, 'index.html'))).toEqual(true)

  const mainJs = glob.sync(['*.js'], {
    cwd: distFolder,
  })

  const logo = glob.sync(['*.png'], {
    cwd: distFolder,
  })

  const htmlContents = readFile(join(distFolder, 'index.html'))
  const mainJsContents = readFile(join(distFolder, mainJs[0]))

  // Proper path to main bundle.
  expect(htmlContents).toContain(`src="/${mainJs[0]}"`)
  // Proper path to logo.
  expect(mainJsContents).toContain(`"/${logo[0]}"`)
})

test('Deep public path applied properly in bundle.', async () => {
  const path = 'hello/world'
  const noPublicPathStructure = [
    packageJson('publicpath', { publicPath: path }),
    indexJavaScript(`import logo from 'logo.png'; console.log(logo)`),
    pngLogo,
  ]

  prepare(noPublicPathStructure, fixturePath)

  await build()

  const distFolder = join(fixturePath, 'dist')

  expect(existsSync(distFolder)).toEqual(true)
  expect(existsSync(join(distFolder, 'index.html'))).toEqual(true)

  const mainJs = glob.sync(['*.js'], {
    cwd: distFolder,
  })

  const logo = glob.sync(['*.png'], {
    cwd: distFolder,
  })

  const htmlContents = readFile(join(distFolder, 'index.html'))
  const mainJsContents = readFile(join(distFolder, mainJs[0]))

  // Proper path to main bundle.
  expect(htmlContents).toContain(`src="/${path}/${mainJs[0]}"`)
  // Proper path to logo.
  expect(mainJsContents).toContain(`"/${path}/${logo[0]}"`)
})
