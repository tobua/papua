import { copyFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  registerVitest,
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
  writeConfiguration,
} from '../utility/configuration'
// import rspack from '../configuration/rspack'
import { refresh } from '../utility/helper'
import { createConfigurationDirectory } from './utility/create-configuration-directory'

registerVitest(beforeEach, afterEach, vi)

const [fixturePath] = environment('configuration')

beforeEach(refresh)

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
  expect(pkg.stylelint.extends).toEqual('papua/configuration/stylelint.js')

  await writePackageJson(false)

  pkg = readFile('package.json')

  expect(pkg.engines.node).toEqual('>= 16')
  // expect(pkg.engines.test).toEqual('hello')
  expect(pkg.stylelint.extends).toEqual('papua/configuration/stylelint.cjs')
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
  expect(contents).toEqual(`{
  "extends": "papua/configuration/jsconfig"
}
`)

  expect(typeof contentsPackage.compilerOptions).toEqual('object')

  writeJSConfig({ compilerOptions: { jsx: 'react' } })

  const contentsWithOptions = readFile('jsconfig.json')
  const contentsPackageWithOptions = readFile('node_modules/papua/configuration/jsconfig.json')

  expect(contentsPackage).toEqual(contentsPackageWithOptions)
  expect(contentsWithOptions.compilerOptions.jsx).toEqual('react')
  expect(contentsWithOptions.extends).toEqual('papua/configuration/jsconfig')
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

  expect(contents).toEqual(`{
  "extends": "papua/configuration/tsconfig"
}
`)

  expect(typeof contentsPackage.compilerOptions).toEqual('object')
  expect(contentsPackage.compilerOptions.baseUrl).toEqual('../../..')

  writeTSConfig({ compilerOptions: { module: 'commonjs' } })

  const contentsWithOptions = readFile('tsconfig.json')
  const contentsPackageWithOptions = readFile('node_modules/papua/configuration/tsconfig.json')

  expect(contentsPackage).toEqual(contentsPackageWithOptions)
  expect(contentsWithOptions.compilerOptions.module).toEqual('commonjs')
  expect(contentsWithOptions.extends).toEqual('papua/configuration/tsconfig')
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

test('Creates cypress.json with project default properties.', async () => {
  prepare([packageJson('cypress')])

  const packageCypressConfigurationPath = join(
    fixturePath,
    'node_modules/papua/configuration/cypress.config.js'
  )
  createConfigurationDirectory(fixturePath)
  copyFileSync(
    join(process.cwd(), './../../../configuration/cypress.config.js'),
    join(process.cwd(), './node_modules/papua/configuration/cypress.config.js')
  )

  expect(existsSync(packageCypressConfigurationPath)).toEqual(true)
  // TODO cannot import ESM from CJS
  // const contents = await import(packageCypressConfigurationPath)
  // expect(contents.chromeWebSecurity).toEqual(false)
})

// test('Root cypress.json will extend package configuration.', () => {
//   prepare([
//     packageJson('cypress'),
//     json('cypress.json', {
//       chromeWebSecurity: true,
//       firefoxGcInterval: {
//         runMode: 1,
//       },
//     }),
//   ])

//   const userCypressConfigurationPath = join(fixturePath, 'cypress.json')
//   const packageCypressConfigurationPath = join(
//     fixturePath,
//     'node_modules/papua/configuration/cypress.json'
//   )
//   createConfigurationDirectory(fixturePath)
//   writeFile('node_modules/papua/configuration/cypress.json', {})

//   const userContentsBefore = readFile(userCypressConfigurationPath)

//   configureCypress()

//   expect(existsSync(userCypressConfigurationPath)).toEqual(true)
//   expect(readFile(userCypressConfigurationPath)).toEqual(userContentsBefore)
//   expect(existsSync(packageCypressConfigurationPath)).toEqual(true)
//   const contents = readFile(packageCypressConfigurationPath)
//   expect(contents.chromeWebSecurity).toEqual(true)
//   expect(contents.firefoxGcInterval.runMode).toEqual(1)
// })

// test('package.json cypress configuration will override cypress.json.', () => {
//   prepare([
//     packageJson('cypress', {
//       papua: {
//         cypress: {
//           defaultCommandTimeout: 6000,
//           firefoxGcInterval: {
//             runMode: 2,
//           },
//         },
//       },
//     }),
//     json('cypress.json', {
//       chromeWebSecurity: true,
//       firefoxGcInterval: {
//         runMode: 1,
//       },
//     }),
//   ])

//   const packageCypressConfigurationPath = join(
//     fixturePath,
//     'node_modules/papua/configuration/cypress.json'
//   )
//   createConfigurationDirectory(fixturePath)
//   writeFile('node_modules/papua/configuration/cypress.json', {})

//   configureCypress()

//   const contents = readFile(packageCypressConfigurationPath)
//   expect(contents.chromeWebSecurity).toEqual(true)
//   expect(contents.defaultCommandTimeout).toEqual(6000)
//   expect(contents.firefoxGcInterval.runMode).toEqual(2)
// })

// test('webpack babel configuration can be extended in package.json.', () => {
//   prepare([
//     packageJson('webpack-babel', {
//       papua: {
//         babel: {
//           presets: ['@babel/whatever'],
//           plugins: ['@emotion'],
//         },
//       },
//     }),
//   ])

//   const configuration = rspack(true)

//   expect(configuration.module.rules[0].use.options).toBeDefined()
//   expect(configuration.module.rules[0].use.options.plugins).toEqual(['@emotion'])
//   expect(configuration.module.rules[0].use.options.presets).toContain('@babel/whatever')
//   // Additional presets are merged with existing one's.
//   expect(configuration.module.rules[0].use.options.presets).toContain('@babel/env')
// })
