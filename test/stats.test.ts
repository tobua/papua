import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  registerVitest,
  environment,
  prepare,
  packageJson,
  file,
  listFilesMatching,
} from 'jest-fixture'
import { build, configure } from '../index'
import { refresh } from '../utility/helper'

process.env.PAPUA_TEST = process.cwd()

registerVitest(beforeEach, afterEach, vi)

environment('stats')

const consoleLogMock = vi.fn()
console.log = consoleLogMock

beforeEach(() => {
  refresh()
  consoleLogMock.mockClear()
})

test('Stats list all generated assets.', async () => {
  const { dist } = prepare([
    packageJson('stats-basic'),
    file(
      'index.js',
      `import './styles.css';
    import './logo.load.png';
    
    console.log('test')`
    ),
    file('styles.css', 'p { color: red; }'),
    {
      name: 'logo.load.png',
      copy: 'test/asset/logo.png',
    },
  ])

  await build(false)

  const output = consoleLogMock.mock.calls.join('\n')
  const files = listFilesMatching('**/*', dist)

  files.forEach((fileName) => {
    expect(output).toContain(fileName)
  })

  expect(output).toContain('seconds') // Includes build duration in milliseconds or seconds.

  expect(output).not.toContain('Type check finished')
})

test('Only actual entry files are listed.', async () => {
  prepare([
    packageJson('stats-entry'),
    file(
      'index.js',
      `import './not-entry';
      console.log('is-entry')`
    ),
    file('not-entry.js', 'console.log("is-not-entry")'),
  ])

  await build(false)

  const output = consoleLogMock.mock.calls.join('\n')

  expect(output).toContain('Entry')
  expect(output).toContain('index.js')
  expect(output).not.toContain('not-entry.js')
})

test('Multiple entries are listed.', async () => {
  prepare([
    packageJson('stats-multi-entry', { papua: { entry: ['first.js', 'second.js'] } }),
    file(
      'first.js',
      `import './not-entry';
        console.log('is-first-entry')`
    ),
    file(
      'second.js',
      `import './not-entry';
        console.log('is-second-entry')`
    ),
    file('not-entry.js', 'console.log("is-not-entry")'),
  ])

  await build(false)

  const output = consoleLogMock.mock.calls.join('\n')

  expect(output).toContain('Entry')
  expect(output).toContain('first.js')
  expect(output).toContain('second.js')
  expect(output).toContain('(main)')
  expect(output).not.toContain('not-entry.js')
})

test('Entry chunks and files are listed.', async () => {
  prepare([
    packageJson('stats-multi-entry', {
      papua: { entry: { one: ['first.js', 'second.js'], two: ['third.js'] } },
    }),
    file('first.js', ''),
    file('second.js', ''),
    file('third.js', ''),
  ])

  await build(false)

  const output = consoleLogMock.mock.calls.join('\n')

  expect(output).toContain('Entry')
  expect(output).not.toContain('(main)')
  expect(output).toContain('first.js, second.js (one)')
  expect(output).toContain('third.js (two)')
})

test('Message for successful type check when building for production.', async () => {
  prepare([packageJson('stats-typescript'), file('index.ts', 'console.log("typescript")')])

  configure() // Required for tsconfig.json
  await build(false)

  const output = consoleLogMock.mock.calls.join('\n')

  expect(output).toContain('Type check finished')
  expect(output).toContain('index.ts (main)')
})

test('Message for successful type check also present when errors.', async () => {
  prepare([packageJson('stats-typescript'), file('index.ts', 'const test: string = 5')])

  configure() // Required for tsconfig.json
  await build(false)

  const output = consoleLogMock.mock.calls.join('\n')

  expect(output).toContain("'number' is not assignable to type 'string'")
  expect(output).toContain('Type check finished')
  expect(output).toContain('index.ts (main)')
})
