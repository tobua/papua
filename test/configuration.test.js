import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import {
  environment,
  prepare,
  packageJson,
  file,
  json,
  readFile,
  writeFile,
} from 'jest-fixture'
import {
  writeGitIgnore,
  writeJSConfig,
  writeTSConfig,
  writePackageJson,
} from '../utility/configuration.js'
import { configureCypress } from '../script/test.js'
import { refresh } from '../utility/helper.js'
import { createConfigurationDirectory } from './utility/create-configuration-directory.js'

const [fixturePath] = environment('configuration')

beforeEach(refresh)

test('Adds necessary package json properties.', () => {
  prepare([packageJson('simple')])

  const { packageContents } = writePackageJson()

  expect(typeof packageContents.papua).toEqual('object')

  const pkg = readFile('package.json')

  expect(packageContents.papua).toEqual({})
  expect({ ...pkg, papua: {} }).toEqual(packageContents)
  // No tests available.
  expect(pkg.scripts.test).toEqual(undefined)
  expect(Object.keys(pkg.scripts).length).toEqual(1)
  expect(pkg.prettier && pkg.eslintConfig && pkg.stylelint && true).toEqual(
    true
  )
})

test('Updates old package json properties.', () => {
  prepare([
    packageJson('outdated', {
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
    }),
    file('index.ts', ''),
    file('test/basic.test.ts', "test('hello', () => {})"),
  ])

  let pkg = readFile('package.json')

  expect(pkg.engines.test).toEqual('hello')
  expect(pkg.engines.node).toEqual('>= 13.2.0')
  expect(pkg.jest.globals['ts-jest'].tsConfig).toBeDefined()
  expect(pkg.jest.globals['ts-jest'].tsconfig).not.toBeDefined()
  expect(pkg.stylelint.extends).toEqual('papua/configuration/stylelint.js')

  writePackageJson()

  pkg = readFile('package.json')

  expect(pkg.engines.node).toEqual('>= 14')
  expect(pkg.engines.test).toEqual('hello')
  expect(pkg.jest.globals['ts-jest'].tsConfig).not.toBeDefined()
  expect(pkg.jest.globals['ts-jest'].tsconfig).toBeDefined()
  expect(pkg.stylelint.extends).toEqual('papua/configuration/stylelint.cjs')
})

test('Adds an empty package.json if none can be found.', () => {
  prepare([
    {
      name: '.gitkeep',
    },
  ])

  const packageJsonPath = join(fixturePath, 'package.json')

  expect(existsSync(packageJsonPath)).toEqual(false)

  writePackageJson()

  expect(existsSync(packageJsonPath)).toEqual(true)

  const pkg = readFile('package.json')

  expect(Object.keys(pkg.scripts).length).toEqual(1)
})

test('Generates jsconfig extending package config.', () => {
  prepare([packageJson('simple')])

  const jsconfigPath = join(fixturePath, 'jsconfig.json')
  const packageConfigPath = join(
    fixturePath,
    'node_modules/papua/configuration/jsconfig.json'
  )
  createConfigurationDirectory(fixturePath)
  writeFile('node_modules/papua/configuration/jsconfig.json', {})

  writeJSConfig({})

  expect(existsSync(jsconfigPath)).toEqual(true)
  expect(existsSync(packageConfigPath)).toEqual(true)

  const contents = readFileSync(jsconfigPath, 'utf8')
  const contentsPackage = readFile(
    'node_modules/papua/configuration/jsconfig.json'
  )

  // Prettier formatting is applied.
  expect(contents).toEqual(`{
  "extends": "papua/configuration/jsconfig"
}
`)

  expect(typeof contentsPackage.compilerOptions).toEqual('object')

  writeJSConfig({ compilerOptions: { jsx: 'react' } })

  const contentsWithOptions = readFile('jsconfig.json')
  const contentsPackageWithOptions = readFile(
    'node_modules/papua/configuration/jsconfig.json'
  )

  expect(contentsPackage).toEqual(contentsPackageWithOptions)
  expect(contentsWithOptions.compilerOptions.jsx).toEqual('react')
  expect(contentsWithOptions.extends).toEqual('papua/configuration/jsconfig')
})

test('Generates tsconfig extending package config.', () => {
  prepare([
    packageJson('typescript'),
    file('index.ts', `console.log('typescript')`),
  ])

  const tsconfigPath = join(fixturePath, 'tsconfig.json')
  const packageConfigPath = join(
    fixturePath,
    'node_modules/papua/configuration/tsconfig.json'
  )
  createConfigurationDirectory(fixturePath)
  writeFile('node_modules/papua/configuration/tsconfig.json', {})

  writeTSConfig({})

  expect(existsSync(tsconfigPath)).toEqual(true)
  expect(existsSync(packageConfigPath)).toEqual(true)

  const contents = readFileSync(tsconfigPath, 'utf8')
  const contentsPackage = readFile(
    'node_modules/papua/configuration/tsconfig.json'
  )

  expect(contents).toEqual(`{
  "extends": "papua/configuration/tsconfig"
}
`)

  expect(typeof contentsPackage.compilerOptions).toEqual('object')
  expect(contentsPackage.compilerOptions.baseUrl).toEqual('../../..')

  writeTSConfig({ compilerOptions: { module: 'commonjs' } })

  const contentsWithOptions = readFile('tsconfig.json')
  const contentsPackageWithOptions = readFile(
    'node_modules/papua/configuration/tsconfig.json'
  )

  expect(contentsPackage).toEqual(contentsPackageWithOptions)
  expect(contentsWithOptions.compilerOptions.module).toEqual('commonjs')
  expect(contentsWithOptions.extends).toEqual('papua/configuration/tsconfig')
})

test('Fallback to put whole tsconfig into user folder if not writable.', () => {
  prepare([
    packageJson('typescript'),
    file('index.ts', `console.log('typescript')`),
  ])

  const tsconfigPath = join(fixturePath, 'tsconfig.json')
  const packageConfigPath = join(
    fixturePath,
    'node_modules/papua/configuration/tsconfig.json'
  )

  writeTSConfig({ compilerOptions: { module: 'commonjs' } })

  expect(existsSync(tsconfigPath)).toEqual(true)
  expect(existsSync(packageConfigPath)).toEqual(false)

  const contentsWithOptions = readFile('tsconfig.json')

  expect(contentsWithOptions.extends).toEqual(undefined)
  expect(contentsWithOptions.compilerOptions.module).toEqual('commonjs')
  // Directory is reduced to match user folder.
  expect(contentsWithOptions.compilerOptions.baseUrl).toEqual('.')
})

test('Generates gitignore with default entries.', () => {
  prepare([packageJson('gitignore'), file('index.js', '')])

  const gitignorePath = join(fixturePath, '.gitignore')

  writeGitIgnore([])

  expect(existsSync(gitignorePath)).toEqual(true)

  const contents = readFile('.gitignore')

  expect(contents).toEqual(
    ['node_modules', 'package-lock.json', 'jsconfig.json', 'dist', ''].join(
      '\r\n'
    )
  )
})

test('Generates proper gitignore for typescript.', () => {
  prepare([
    packageJson('typescript'),
    file('index.ts', `console.log('typescript')`),
  ])

  const gitignorePath = join(fixturePath, '.gitignore')

  writeGitIgnore([])

  expect(existsSync(gitignorePath)).toEqual(true)

  const contents = readFile('.gitignore')

  expect(contents).toEqual(
    ['node_modules', 'package-lock.json', 'tsconfig.json', 'dist', ''].join(
      '\r\n'
    )
  )
})

test('Creates cypress.json with project default properties.', () => {
  prepare([packageJson('cypress')])

  const packageCypressConfigurationPath = join(
    fixturePath,
    'node_modules/papua/configuration/cypress.json'
  )
  createConfigurationDirectory(fixturePath)
  writeFile('node_modules/papua/configuration/cypress.json', {})

  configureCypress()

  expect(existsSync(packageCypressConfigurationPath)).toEqual(true)
  const contents = readFile(packageCypressConfigurationPath)
  expect(contents.chromeWebSecurity).toEqual(false)
})

test('Root cypress.json will extend package configuration.', () => {
  prepare([
    packageJson('cypress'),
    json('cypress.json', {
      chromeWebSecurity: true,
      firefoxGcInterval: {
        runMode: 1,
      },
    }),
  ])

  const userCypressConfigurationPath = join(fixturePath, 'cypress.json')
  const packageCypressConfigurationPath = join(
    fixturePath,
    'node_modules/papua/configuration/cypress.json'
  )
  createConfigurationDirectory(fixturePath)
  writeFile('node_modules/papua/configuration/cypress.json', {})

  const userContentsBefore = readFile(userCypressConfigurationPath)

  configureCypress()

  expect(existsSync(userCypressConfigurationPath)).toEqual(true)
  expect(readFile(userCypressConfigurationPath)).toEqual(userContentsBefore)
  expect(existsSync(packageCypressConfigurationPath)).toEqual(true)
  const contents = readFile(packageCypressConfigurationPath)
  expect(contents.chromeWebSecurity).toEqual(true)
  expect(contents.firefoxGcInterval.runMode).toEqual(1)
})

test('package.json cypress configuration will override cypress.json.', () => {
  prepare([
    packageJson('cypress', {
      papua: {
        cypress: {
          defaultCommandTimeout: 6000,
          firefoxGcInterval: {
            runMode: 2,
          },
        },
      },
    }),
    json('cypress.json', {
      chromeWebSecurity: true,
      firefoxGcInterval: {
        runMode: 1,
      },
    }),
  ])

  const packageCypressConfigurationPath = join(
    fixturePath,
    'node_modules/papua/configuration/cypress.json'
  )
  createConfigurationDirectory(fixturePath)
  writeFile('node_modules/papua/configuration/cypress.json', {})

  configureCypress()

  const contents = readFile(packageCypressConfigurationPath)
  expect(contents.chromeWebSecurity).toEqual(true)
  expect(contents.defaultCommandTimeout).toEqual(6000)
  expect(contents.firefoxGcInterval.runMode).toEqual(2)
})
