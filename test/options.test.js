import { environment, prepare, packageJson, file } from 'jest-fixture'
import { options } from '../utility/options.js'
import { refresh } from '../utility/helper.js'

environment('options')

beforeEach(refresh)

test('Options set correctly for simple project.', () => {
  prepare([packageJson('simple')])

  const result = options()

  expect(result.typescript).toEqual(false)
  expect(result.react).toEqual(false)
  expect(result.entry).toEqual(['./index.js'])
})

test('Proper options for TS project.', () => {
  prepare([packageJson('typescript'), file('index.ts', `console.log('typescript')`)])

  const result = options()

  expect(result.typescript).toEqual(true)
  expect(result.react).toEqual(false)
  expect(result.entry).toEqual(['./index.ts'])
})

test('Custom entry is used.', () => {
  prepare([
    packageJson('custom-entry', {
      papua: {
        entry: './another.js',
      },
    }),
    file('another.js', ''),
  ])

  const result = options()

  expect(result.typescript).toEqual(false)
  expect(result.react).toEqual(false)
  expect(result.entry).toEqual(['./another.js'])
})
