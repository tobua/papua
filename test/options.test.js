import { options } from '../utility/options.js'
import { refresh } from '../utility/helper.js'
import { environment, prepare } from './utility/prepare.js'
import { packageJson, javaScriptFile } from './utility/structures.js'

const [fixturePath] = environment('options')

beforeEach(() => refresh())

test('Options set correctly for simple project.', () => {
  prepare('simple', fixturePath)

  const result = options()

  expect(result.typescript).toEqual(false)
  expect(result.react).toEqual(false)
  expect(result.entry).toEqual(['./index.js'])
})

test('Proper options for TS project.', () => {
  prepare('typescript', fixturePath)

  const result = options()

  expect(result.typescript).toEqual(true)
  expect(result.react).toEqual(false)
  expect(result.entry).toEqual(['./index.ts'])
})

test('Custom entry is used.', () => {
  const customEntryStructure = [
    packageJson('custom-entry', {
      entry: './another.js',
    }),
    javaScriptFile('another.js'),
  ]
  prepare(customEntryStructure, fixturePath)

  const result = options()

  expect(result.typescript).toEqual(false)
  expect(result.react).toEqual(false)
  expect(result.entry).toEqual(['./another.js'])
})
