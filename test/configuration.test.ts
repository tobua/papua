import { cpSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { test, expect, afterEach, vi } from 'vitest'
import { environment, prepare, packageJson, file, json, readFile, writeFile } from 'jest-fixture'
import {
  writeGitIgnore,
  writeJSConfig,
  writeTSConfig,
  writePackageJson,
  writeConfiguration,
} from '../utility/configuration'
import { createConfigurationDirectory } from './utility/create-configuration-directory'

const [fixturePath] = environment('configuration')

afterEach(() => {
  vi.resetModules()
})

test('Adds necessary package json properties.', async () => {
  prepare([packageJson('simple')])

  const { packageContents } = await writePackageJson(false)

  expect(typeof packageContents.papua).toEqual('object')

  const pkg = readFile('package.json')

  expect(packageContents.papua).toEqual({})
  expect({ ...pkg, papua: {} }).toEqual(packageContents)
  // No tests available.
  expect(pkg.scripts.test).toEqual(undefined)
  expect(Object.keys(pkg.scripts).length).toEqual(1)
  expect(pkg.prettier && pkg.eslintConfig && pkg.stylelint && true).toEqual(true)
  expect(pkg.$schema).toContain('schema.json')
})

test('Configures multiple packages in workspaces setup.', async () => {
  prepare([
    packageJson('workspaces', {
      workspaces: ['demo/*', 'plugin'],
    }),
    json('demo/vite/package.json', {
      name: 'demo-vite',
      dependencies: {
        papua: 'latest',
      },
    }),
    json('demo/svelte/package.json', {
      name: 'demo-svelte',
      dependencies: {
        missing: 'latest',
      },
    }),
    json('demo/vue/package.json', {
      name: 'demo-vue',
      devDependencies: {
        papua: 'latest',
      },
    }),
    json('build/package.json', {
      name: 'build-external',
      dependencies: {
        papua: 'latest',
      },
    }),
    json('plugin/package.json', {
      name: 'plugin',
      dependencies: {
        papua: 'latest',
      },
    }),
  ])

  await writeConfiguration(false)

  const vitePackage = readFile('demo/vite/package.json')

  expect(vitePackage.name).toEqual('demo-vite')
  expect(vitePackage.scripts.start).toEqual('papua start')
})

test('Updates old package json properties.', async () => {
  prepare([
    packageJson('outdated', {
      engines: {
        test: 'hello',
        node: '>= 13.2.0',
      },
    }),
    file('index.ts', ''),
    file('test/basic.test.ts', "test('hello', () => {})"),
  ])

  let pkg = readFile('package.json')

  expect(pkg.engines.test).toEqual('hello')
  expect(pkg.engines.node).toEqual('>= 13.2.0')

  await writePackageJson(false)

  pkg = readFile('package.json')

  expect(pkg.engines.node).toEqual('>= 16')
  expect(pkg.engines.test).toEqual('hello')
})

test('Adds an empty package.json if none can be found.', async () => {
  prepare([
    {
      name: '.gitkeep',
    },
  ])

  const packageJsonPath = join(fixturePath, 'package.json')

  expect(existsSync(packageJsonPath)).toEqual(false)

  await writePackageJson(false)

  expect(existsSync(packageJsonPath)).toEqual(true)

  const pkg = readFile('package.json')

  expect(Object.keys(pkg.scripts).length).toEqual(1)
})

test('Generates jsconfig extending package config.', () => {
  prepare([packageJson('simple'), file('index.js', 'console.log("test")')])

  const jsconfigPath = join(fixturePath, 'jsconfig.json')
  const packageConfigPath = join(fixturePath, 'node_modules/papua/configuration/jsconfig.json')
  createConfigurationDirectory(fixturePath)
  writeFile('node_modules/papua/configuration/jsconfig.json', {})

  writeJSConfig({})

  expect(existsSync(jsconfigPath)).toBe(true)
  expect(existsSync(packageConfigPath)).toBe(true)

  const contents = readFileSync(jsconfigPath, 'utf8')
  const contentsPackage = readFile('node_modules/papua/configuration/jsconfig.json')

  // Prettier formatting is applied.
  expect(JSON.parse(contents)).toEqual({
    extends: join(process.cwd(), 'node_modules/papua/configuration/jsconfig.json'),
  })

  expect(typeof contentsPackage.compilerOptions).toEqual('object')

  writeJSConfig({ compilerOptions: { jsx: 'react' } })

  const contentsWithOptions = readFile('jsconfig.json')
  const contentsPackageWithOptions = readFile('node_modules/papua/configuration/jsconfig.json')

  expect(contentsPackage).toEqual(contentsPackageWithOptions)
  expect(contentsWithOptions.compilerOptions.jsx).toEqual('react')
  expect(contentsWithOptions.extends).toEqual(
    join(process.cwd(), 'node_modules/papua/configuration/jsconfig.json')
  )
})

test('Generates tsconfig extending package config.', () => {
  prepare([packageJson('typescript'), file('index.ts', `console.log('typescript')`)])

  const tsconfigPath = join(fixturePath, 'tsconfig.json')
  const packageConfigPath = join(fixturePath, 'node_modules/papua/configuration/tsconfig.json')
  createConfigurationDirectory(fixturePath)
  writeFile('node_modules/papua/configuration/tsconfig.json', {})

  writeTSConfig({})

  expect(existsSync(tsconfigPath)).toBe(true)
  expect(existsSync(packageConfigPath)).toBe(true)

  const contents = readFileSync(tsconfigPath, 'utf8')
  const contentsPackage = readFile('node_modules/papua/configuration/tsconfig.json')

  expect(JSON.parse(contents)).toEqual({
    extends: join(process.cwd(), 'node_modules/papua/configuration/tsconfig.json'),
  })

  expect(typeof contentsPackage.compilerOptions).toEqual('object')
  expect(contentsPackage.compilerOptions.baseUrl).toEqual('../../..')

  writeTSConfig({ compilerOptions: { module: 'commonjs' } })

  const contentsWithOptions = readFile('tsconfig.json')
  const contentsPackageWithOptions = readFile('node_modules/papua/configuration/tsconfig.json')

  expect(contentsPackage).toEqual(contentsPackageWithOptions)
  expect(contentsWithOptions.compilerOptions.module).toEqual('commonjs')
  expect(contentsWithOptions.extends).toEqual(
    join(process.cwd(), 'node_modules/papua/configuration/tsconfig.json')
  )
})

test('Fallback to put whole tsconfig into user folder if not writable.', () => {
  prepare([packageJson('typescript'), file('index.ts', `console.log('typescript')`)])

  const tsconfigPath = join(fixturePath, 'tsconfig.json')
  const packageConfigPath = join(fixturePath, 'node_modules/papua/configuration/tsconfig.json')

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
    ['node_modules', 'package-lock.json', 'jsconfig.json', 'dist', ''].join('\r\n')
  )
})

test('Generates proper gitignore for typescript.', () => {
  prepare([packageJson('typescript'), file('index.ts', `console.log('typescript')`)])

  const gitignorePath = join(fixturePath, '.gitignore')

  writeGitIgnore([])

  expect(existsSync(gitignorePath)).toEqual(true)

  const contents = readFile('.gitignore')

  expect(contents).toEqual(
    ['node_modules', 'package-lock.json', 'tsconfig.json', 'dist', ''].join('\r\n')
  )
})

test('Creates cypress.config.js with project default properties.', async () => {
  prepare([packageJson('cypress')])

  const packageCypressConfigurationPath = join(
    fixturePath,
    'node_modules/papua/configuration/cypress.config.js'
  )
  cpSync(
    join(process.cwd(), './../../../configuration/cypress.config.js'),
    join(process.cwd(), './node_modules/papua/configuration/cypress.config.js'),
    { recursive: true }
  )

  expect(existsSync(packageCypressConfigurationPath)).toEqual(true)

  const { default: contents } = (await vi.importActual(packageCypressConfigurationPath)) as any
  expect(contents.chromeWebSecurity).toEqual(false)
})

const createCypressConfigFileContents = (
  configuration: string
) => `import { defineConfig } from 'cypress'

export default defineConfig(${configuration})`

test('Root cypress.config.js will extend package configuration.', async () => {
  prepare([
    packageJson('cypress'),
    file(
      'cypress.config.js',
      createCypressConfigFileContents(`{
        chromeWebSecurity: true,
        firefoxGcInterval: {
          runMode: 1,
        },
      }`)
    ),
  ])

  const packageCypressConfigurationPath = join(
    fixturePath,
    'node_modules/papua/configuration/cypress.config.js'
  )

  cpSync(
    join(process.cwd(), '../../../configuration/cypress.config.js'),
    packageCypressConfigurationPath,
    {
      recursive: true,
    }
  )

  const { default: configurationContents } = (await vi.importActual(
    packageCypressConfigurationPath
  )) as any

  expect(configurationContents.chromeWebSecurity).toEqual(true)
  expect(configurationContents.firefoxGcInterval.runMode).toEqual(1)
})

test('package.json cypress configuration will override cypress.config.js.', async () => {
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
    file(
      'cypress.config.js',
      createCypressConfigFileContents(`{
      chromeWebSecurity: true,
      firefoxGcInterval: {
        runMode: 1,
      },
    }`)
    ),
  ])

  const packageCypressConfigurationPath = join(
    fixturePath,
    'node_modules/papua/configuration/cypress.config.js'
  )

  cpSync(
    join(process.cwd(), '../../../configuration/cypress.config.js'),
    packageCypressConfigurationPath,
    {
      recursive: true,
    }
  )

  const { default: contents } = (await vi.importActual(packageCypressConfigurationPath)) as any

  expect(contents.chromeWebSecurity).toEqual(true)
  expect(contents.defaultCommandTimeout).toEqual(6000)
  expect(contents.firefoxGcInterval.runMode).toEqual(2)
})
