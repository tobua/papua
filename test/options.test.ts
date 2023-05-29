import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import { registerVitest, environment, prepare, packageJson, file } from 'jest-fixture'
import { options } from '../utility/options'
import { refresh } from '../utility/helper'

process.env.PAPUA_TEST = process.cwd()

registerVitest(beforeEach, afterEach, vi)

environment('options')

beforeEach(refresh)

test('Options set correctly for simple project.', () => {
  prepare([packageJson('simple')])

  const result = options()

  expect(result.typescript).toEqual(false)
  expect(result.react).toEqual(false)
  expect(result.entry).toEqual(['index.js'])
  expect(result.title).toEqual('simple App')
})

test('Proper options for TS project.', () => {
  prepare([packageJson('typescript'), file('index.ts', `console.log('typescript')`)])

  const result = options()

  expect(result.typescript).toEqual(true)
  expect(result.react).toEqual(false)
  expect(result.entry).toEqual(['index.ts'])
})

test('Custom entry is used.', () => {
  prepare([
    packageJson('custom-entry', {
      papua: {
        entry: './another.js',
        title: 'My-App',
      },
    }),
    file('another.js', ''),
  ])

  const result = options()

  expect(result.typescript).toEqual(false)
  expect(result.react).toEqual(false)
  expect(result.entry).toEqual(['another.js'])
  expect(result.title).toEqual('My-App')
})

test('Cached file is used on second read.', () => {
  prepare([
    packageJson('custom-entry', {
      papua: {
        entry: './another.js',
        title: 'My-App',
      },
    }),
    file('another.js', ''),
  ])

  let result = options()

  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  expect(result.__cached).toBe(undefined)

  result = options()

  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  expect(result.__cached).toBe(true)
})

test('React JSX enabled even with .js entry file.', () => {
  prepare([
    packageJson('jsx-non-entry', {
      dependencies: {
        react: 'latest',
      },
    }),
    file('index.js', 'export default () => <p>test</p>'),
  ])

  const result = options()

  expect(result.typescript).toEqual(false)
  expect(result.react).toEqual(true)
})
