import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'
import {
  writeGitIgnore,
  writeJSConfig,
  writeTSConfig,
  writePackageJson,
} from '../utility/configuration.js'
import { refresh } from '../utility/helper.js'
import { environment, prepare } from './utility/prepare.js'
import { indexTypeScript, testTypeScript } from './utility/structures.js'

const [fixturePath] = environment('configuration')

test('Adds necessary package json properties.', () => {
  prepare('simple', fixturePath)

  refresh()

  const gitignorePath = join(fixturePath, '.gitignore')
  const jsconfigPath = join(fixturePath, 'jsconfig.json')
  const indexJsPath = join(fixturePath, 'index.js')
  const packageJsonPath = join(fixturePath, 'package.json')

  rimraf.sync(jsconfigPath)
  rimraf.sync(indexJsPath)
  rimraf.sync(gitignorePath)

  const { packageContents } = writePackageJson()

  expect(typeof packageContents.papua).toEqual('object')

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  expect(pkg.papua).toEqual({})
  expect(pkg).toEqual(packageContents)
  // No tests available.
  expect(pkg.scripts.test).toEqual(undefined)
  expect(Object.keys(pkg.scripts).length).toEqual(1)
  expect(pkg.prettier && pkg.eslintConfig && pkg.stylelint && true).toEqual(
    true
  )

  rimraf.sync(jsconfigPath)
  rimraf.sync(indexJsPath)
  rimraf.sync(gitignorePath)
  writeFileSync(packageJsonPath, `{\n  "name": "default"\n}\n`)
})

test('Updates old package json properties.', () => {
  const outdatedPackageStructure = [
    {
      name: 'package.json',
      json: true,
      contents: {
        name: 'outdated',
        engines: {
          test: 'hello',
          node: '>= 13.2.0',
        },
        jest: {
          globals: {
            'ts-jest': {
              tsConfig: './node_modules/papua/configuration/tsconfig.json',
            },
          },
        },
        stylelint: {
          extends: 'papua/configuration/stylelint.js',
        },
      },
    },
    indexTypeScript(),
    testTypeScript(),
  ]
  prepare(outdatedPackageStructure, fixturePath)

  refresh()

  const packageJsonPath = join(fixturePath, 'package.json')
  let pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  expect(pkg.engines.test).toEqual('hello')
  expect(pkg.engines.node).toEqual('>= 13.2.0')
  expect(pkg.jest.globals['ts-jest'].tsConfig).toBeDefined()
  expect(pkg.jest.globals['ts-jest'].tsconfig).not.toBeDefined()
  expect(pkg.stylelint.extends).toEqual('papua/configuration/stylelint.js')

  writePackageJson()

  pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  expect(pkg.engines.node).toEqual('>= 14')
  expect(pkg.engines.test).toEqual('hello')
  expect(pkg.jest.globals['ts-jest'].tsConfig).not.toBeDefined()
  expect(pkg.jest.globals['ts-jest'].tsconfig).toBeDefined()
  expect(pkg.stylelint.extends).toEqual('papua/configuration/stylelint.cjs')
})

test('Adds an empty package.json if none can be found.', () => {
  prepare('empty', fixturePath)

  refresh()

  const gitignorePath = join(fixturePath, '.gitignore')
  const jsconfigPath = join(fixturePath, 'jsconfig.json')
  const indexJsPath = join(fixturePath, 'index.js')
  const packageJsonPath = join(fixturePath, 'package.json')

  rimraf.sync(jsconfigPath)
  rimraf.sync(indexJsPath)
  rimraf.sync(gitignorePath)
  rimraf.sync(packageJsonPath)

  expect(existsSync(packageJsonPath)).toEqual(false)

  writePackageJson()

  expect(existsSync(packageJsonPath)).toEqual(true)

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  expect(Object.keys(pkg.scripts).length).toEqual(1)

  rimraf.sync(jsconfigPath)
  rimraf.sync(indexJsPath)
  rimraf.sync(gitignorePath)
  rimraf.sync(packageJsonPath)
})

test('Generates jsconfig extending package config.', () => {
  prepare('simple', fixturePath)

  refresh()

  const gitignorePath = join(fixturePath, '.gitignore')
  const jsconfigPath = join(fixturePath, 'jsconfig.json')
  const indexJsPath = join(fixturePath, 'index.js')
  const nodeModulesPath = join(fixturePath, 'node_modules')
  const packageConfigPath = join(
    fixturePath,
    'node_modules/papua/configuration/jsconfig.json'
  )
  const packageConfigDirectory = join(
    fixturePath,
    'node_modules/papua/configuration'
  )

  rimraf.sync(jsconfigPath)
  rimraf.sync(nodeModulesPath)
  rimraf.sync(indexJsPath)
  rimraf.sync(gitignorePath)

  // Create empty node_module package config to local fixture, so it can be modified.
  mkdirSync(packageConfigDirectory, { recursive: true })
  writeFileSync(packageConfigPath, '{}')

  writeJSConfig({})

  expect(existsSync(jsconfigPath)).toEqual(true)
  expect(existsSync(packageConfigPath)).toEqual(true)

  const contents = readFileSync(jsconfigPath, 'utf8')
  const contentsPackage = readFileSync(packageConfigPath, 'utf8')

  expect(contents).toEqual(`{
  "extends": "papua/configuration/jsconfig"
}
`)

  expect(typeof JSON.parse(contentsPackage).compilerOptions).toEqual('object')

  writeJSConfig({ compilerOptions: { jsx: 'react' } })

  const contentsWithOptions = readFileSync(jsconfigPath, 'utf8')
  const contentsPackageWithOptions = readFileSync(packageConfigPath, 'utf8')

  expect(contentsPackage).toEqual(contentsPackageWithOptions)
  expect(JSON.parse(contentsWithOptions).compilerOptions.jsx).toEqual('react')
  expect(JSON.parse(contentsWithOptions).extends).toEqual(
    'papua/configuration/jsconfig'
  )

  rimraf.sync(jsconfigPath)
  rimraf.sync(indexJsPath)
  rimraf.sync(nodeModulesPath)
  rimraf.sync(gitignorePath)
})

test('Generates tsconfig extending package config.', () => {
  prepare('typescript', fixturePath)

  refresh()

  const gitignorePath = join(fixturePath, '.gitignore')
  const tsconfigPath = join(fixturePath, 'tsconfig.json')
  const nodeModulesPath = join(fixturePath, 'node_modules')
  const packageConfigPath = join(
    fixturePath,
    'node_modules/papua/configuration/tsconfig.json'
  )
  const packageConfigDirectory = join(
    fixturePath,
    'node_modules/papua/configuration'
  )

  rimraf.sync(tsconfigPath)
  rimraf.sync(nodeModulesPath)
  rimraf.sync(gitignorePath)

  // Create empty node_module package config to local fixture, so it can be modified.
  mkdirSync(packageConfigDirectory, { recursive: true })
  writeFileSync(packageConfigPath, '{}')

  writeTSConfig({})

  expect(existsSync(tsconfigPath)).toEqual(true)
  expect(existsSync(packageConfigPath)).toEqual(true)

  const contents = readFileSync(tsconfigPath, 'utf8')
  const contentsPackage = readFileSync(packageConfigPath, 'utf8')

  expect(contents).toEqual(`{
  "extends": "papua/configuration/tsconfig"
}
`)

  expect(typeof JSON.parse(contentsPackage).compilerOptions).toEqual('object')
  expect(JSON.parse(contentsPackage).compilerOptions.baseUrl).toEqual(
    '../../..'
  )

  writeTSConfig({ compilerOptions: { module: 'commonjs' } })

  const contentsWithOptions = readFileSync(tsconfigPath, 'utf8')
  const contentsPackageWithOptions = readFileSync(packageConfigPath, 'utf8')

  expect(contentsPackage).toEqual(contentsPackageWithOptions)
  expect(JSON.parse(contentsWithOptions).compilerOptions.module).toEqual(
    'commonjs'
  )
  expect(JSON.parse(contentsWithOptions).extends).toEqual(
    'papua/configuration/tsconfig'
  )

  rimraf.sync(tsconfigPath)
  rimraf.sync(nodeModulesPath)
  rimraf.sync(gitignorePath)
})

test('Fallback to put whole tsconfig into user folder if not writable.', () => {
  prepare('typescript', fixturePath)

  refresh()

  const gitignorePath = join(fixturePath, '.gitignore')
  const tsconfigPath = join(fixturePath, 'tsconfig.json')
  const nodeModulesPath = join(fixturePath, 'node_modules')
  const packageConfigPath = join(
    fixturePath,
    'node_modules/papua/configuration/tsconfig.json'
  )

  rimraf.sync(tsconfigPath)
  rimraf.sync(nodeModulesPath)
  rimraf.sync(gitignorePath)

  writeTSConfig({ compilerOptions: { module: 'commonjs' } })

  expect(existsSync(tsconfigPath)).toEqual(true)
  expect(existsSync(packageConfigPath)).toEqual(false)

  const contentsWithOptions = JSON.parse(readFileSync(tsconfigPath, 'utf8'))

  expect(contentsWithOptions.extends).toEqual(undefined)
  expect(contentsWithOptions.compilerOptions.module).toEqual('commonjs')
  // Directory is reduced to match user folder.
  expect(contentsWithOptions.compilerOptions.baseUrl).toEqual('.')

  rimraf.sync(tsconfigPath)
  rimraf.sync(nodeModulesPath)
  rimraf.sync(gitignorePath)
})

test('Generates gitignore with default entries.', () => {
  prepare('gitignore', fixturePath)

  refresh()

  const gitignorePath = join(fixturePath, '.gitignore')

  rimraf.sync(gitignorePath)

  writeGitIgnore([])

  expect(existsSync(gitignorePath)).toEqual(true)

  const contents = readFileSync(gitignorePath, 'utf8')

  expect(contents).toEqual(
    ['node_modules', 'package-lock.json', 'jsconfig.json', 'dist', ''].join(
      '\r\n'
    )
  )

  rimraf.sync(gitignorePath)
})

test('Generates proper gitignore for typescript.', () => {
  prepare('typescript', fixturePath)

  refresh()

  const gitignorePath = join(fixturePath, '.gitignore')

  rimraf.sync(gitignorePath)

  writeGitIgnore([])

  expect(existsSync(gitignorePath)).toEqual(true)

  const contents = readFileSync(gitignorePath, 'utf8')

  expect(contents).toEqual(
    ['node_modules', 'package-lock.json', 'tsconfig.json', 'dist', ''].join(
      '\r\n'
    )
  )

  rimraf.sync(gitignorePath)
})
