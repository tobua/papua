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
  json,
} from 'jest-fixture'
import { existsSync } from 'fs'
import { build } from '../index'
import { refresh } from '../utility/helper'
import { writeConfiguration } from '../utility/configuration'
import { setWorkspacePath } from '../utility/path'

process.env.PAPUA_TEST = process.cwd()

registerVitest(beforeEach, afterEach, vi)

// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
const [_, setCwd] = environment('workspaces')

beforeEach(refresh)

test('Configuration paths properly resolved in a workspaces setup.', async () => {
  prepare([
    packageJson('workspaces', { workspaces: ['demo', 'nested/deep/*'] }),
    json('demo/package.json', { dependencies: { papua: 'latest' } }),
    file('demo/index.js', `console.log('demo')`),
    json('nested/deep/first/package.json', { dependencies: { papua: 'latest' } }),
    file('nested/deep/first/index.js', `console.log('first')`),
    json('nested/deep/second/package.json', { dependencies: { papua: 'latest' } }),
    file('nested/deep/second/index.ts', `console.log('second')`),
  ])

  await writeConfiguration(false)

  // Check config
  const configs = listFilesMatching('**/*config.json')

  expect(configs).toContain('demo/jsconfig.json')
  expect(configs).toContain('nested/deep/first/jsconfig.json')
  expect(configs).toContain('nested/deep/second/tsconfig.json')

  const gitignores = listFilesMatching('**/.gitignore')

  expect(gitignores).toContain('demo/.gitignore')
  expect(gitignores).toContain('nested/deep/first/.gitignore')
  expect(gitignores).toContain('nested/deep/second/.gitignore')

  const configContents: any = contentsForFilesMatching('**/*config.json')

  expect(configContents[0].contents).toEqual({
    compilerOptions: {
      baseUrl: '.',
      jsx: 'react-jsx',
    },
  })

  expect(configContents[1].contents).toEqual({
    compilerOptions: {
      baseUrl: '.',
      jsx: 'react-jsx',
    },
  })

  expect(configContents[2].contents.compilerOptions).toContain({
    baseUrl: '.',
    jsx: 'react-jsx',
    esModuleInterop: true,
  })

  expect(configContents[2].contents.files).toEqual(['index.ts'])

  const initialCwd = process.cwd()

  // Run build in /nested/deep/second
  setCwd(join(initialCwd, 'nested/deep/second'))

  setWorkspacePath('.')
  refresh() // Make sure options are reloaded for project being built.

  await build(false)

  let files = listFilesMatching('**/*', 'dist')

  expect(files).toContain('index.html')
  expect(files).toContain('logo.png')

  let jsFileContents = contentsForFilesMatching('**/*.js', 'dist')

  expect(jsFileContents[0].contents).toContain('"second"')

  // Run build in /demo
  setCwd(join(initialCwd, 'demo'))

  setWorkspacePath('.')
  refresh()

  await build(false)

  files = listFilesMatching('**/*', 'dist')

  expect(files).toContain('index.html')
  expect(files).toContain('logo.png')

  jsFileContents = contentsForFilesMatching('**/*.js', 'dist')

  expect(jsFileContents[0].contents).toContain('"demo"')
}, 10000)

test('localDependencies work with workspaces setup and cyclical import.', async () => {
  prepare([
    packageJson('local-dependencies-workspaces', {
      name: 'wrapper',
      type: 'module',
      workspaces: ['demo'],
      main: './dist/index.js',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          import: {
            types: './dist/index.d.ts',
            // Important: default needs to be last, otherwise build fails.
            default: './dist/index.js',
          },
        },
      },
    }),
    json('demo/package.json', {
      type: 'module',
      localDependencies: {
        wrapper: '..',
      },
    }),
    file('dist/index.js', 'export const localDependency = () => "local-dependency"'),
    file('dist/index.d.ts', 'export declare const localDependency: () => string;'),
    // Ensure node_modules exist (which is the case on postinstall).
    json('demo/node_modules/installed/package.json', { name: 'installed' }),
    // Imports symlinked modules.
    file(
      'demo/index.ts',
      `import { localDependency } from 'wrapper'; console.log(localDependency())`
    ),
  ])

  const initialCwd = process.cwd()

  setCwd(join(process.cwd(), 'demo'))
  setWorkspacePath('.')
  refresh()

  await writeConfiguration(false)

  const files = listFilesMatching('**/*', initialCwd)

  expect(files).toContain('demo/tsconfig.json')
  expect(existsSync(join(process.cwd(), 'node_modules/wrapper'))).toBe(true)

  await build(false)

  const mainJsContents = contentsForFilesMatching('*.js', 'dist')[0].contents
  expect(mainJsContents).toContain('"local-dependency"')
})
