import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'
import {
  writeGitIgnore,
  writeJSConfig,
  writeTSConfig,
} from '../utility/configuration.js'
import { refresh } from '../utility/helper.js'

const CWD = process.cwd()
const cwdSpy = jest.spyOn(process, 'cwd')

test('Generates jsconfig extending package config.', () => {
  refresh()
  const fixturePath = join(CWD, 'test/fixture/default')
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
  cwdSpy.mockReturnValue(fixturePath)

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
  refresh()
  const fixturePath = join(CWD, 'test/fixture/typescript')
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
  cwdSpy.mockReturnValue(fixturePath)

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
  refresh()
  const fixturePath = join(CWD, 'test/fixture/typescript')
  const gitignorePath = join(fixturePath, '.gitignore')
  const tsconfigPath = join(fixturePath, 'tsconfig.json')
  const nodeModulesPath = join(fixturePath, 'node_modules')
  const packageConfigPath = join(
    fixturePath,
    'node_modules/papua/configuration/tsconfig.json'
  )
  cwdSpy.mockReturnValue(fixturePath)

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
  refresh()
  const fixturePath = join(CWD, 'test/fixture/gitignore')
  const gitignorePath = join(fixturePath, '.gitignore')
  cwdSpy.mockReturnValue(fixturePath)

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
  refresh()
  const fixturePath = join(CWD, 'test/fixture/typescript')
  const gitignorePath = join(fixturePath, '.gitignore')
  cwdSpy.mockReturnValue(fixturePath)

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
