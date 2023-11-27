import { EOL } from 'os'
import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  environment,
  prepare,
  packageJson,
  file,
  listFilesMatching,
  writeFile,
  readFile,
} from 'jest-fixture'
import { join } from 'path'
import { build, configure } from '../index'
import { createRspackConfig } from './utility/configuration'

const [fixturePath] = environment('stats')

const consoleLogMock = vi.fn()
console.log = consoleLogMock

beforeEach(() => {
  consoleLogMock.mockClear()
})

afterEach(() => {
  vi.resetModules()
})

const rspackConfig = createRspackConfig()

test('Stats list all generated assets.', async () => {
  const { dist } = prepare([
    packageJson('stats-basic'),
    file(
      'index.js',
      `import './styles.css';
    import './logo.load.png';
    
    console.log('test')`,
    ),
    file('styles.css', 'p { color: red; }'),
    {
      name: 'logo.load.png',
      copy: 'test/asset/logo.png',
    },
  ])

  await build(false)

  const output = consoleLogMock.mock.calls.join(EOL)
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
      console.log('is-entry')`,
    ),
    file('not-entry.js', 'console.log("is-not-entry")'),
  ])

  await build(false)

  const output = consoleLogMock.mock.calls.join(EOL)

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
        console.log('is-first-entry')`,
    ),
    file(
      'second.js',
      `import './not-entry';
        console.log('is-second-entry')`,
    ),
    file('not-entry.js', 'console.log("is-not-entry")'),
  ])

  await build(false)

  const output = consoleLogMock.mock.calls.join(EOL)

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

  const output = consoleLogMock.mock.calls.join(EOL)

  expect(output).toContain('Entry')
  expect(output).not.toContain('(main)')
  expect(output).toContain('first.js, second.js (one)')
  expect(output).toContain('third.js (two)')
})

test('Message for successful type check when building for production.', async () => {
  prepare([packageJson('stats-typescript'), file('index.ts', 'console.log("typescript")')])

  writeFile(
    'node_modules/papua/configuration/.prettierignore',
    readFile('../../../configuration/.prettierignore'),
  )
  writeFile(
    'node_modules/papua/configuration/template.html',
    readFile('../../../configuration/template.html'),
  )

  await configure() // Required for tsconfig.json
  await build(false)

  const output = consoleLogMock.mock.calls.join(EOL)

  expect(output).toContain('Type check finished')
  expect(output).toContain('index.ts (main)')
})

test('Message for successful type check also present when errors.', async () => {
  prepare([packageJson('stats-typescript'), file('index.ts', 'const test: string = 5')])

  writeFile(
    'node_modules/papua/configuration/.prettierignore',
    readFile('../../../configuration/.prettierignore'),
  )
  writeFile(
    'node_modules/papua/configuration/template.html',
    readFile('../../../configuration/template.html'),
  )

  await configure() // Required for tsconfig.json
  await build(false)

  const output = consoleLogMock.mock.calls.join(EOL)

  expect(output).toContain("'number' is not assignable to type 'string'")
  expect(output).toContain('Type check finished')
  expect(output).toContain('index.ts (main)')
})

test('JSX in regular JS will show an error pointing to the source.', async () => {
  prepare([
    packageJson('stats-jsx-in-js'),
    file('index.js', `const Component = () => <p>hello</p>`),
  ])

  await build(false)

  const output = consoleLogMock.mock.calls.join(EOL)

  expect(output).toContain('1 Error:')
  expect(output).toContain('Expression expected')
  expect(output).toContain('Unterminated regexp literal')
  expect(output).toContain('<p>hello</p>')
})

test('Entry stats are separated by entries for each configuration.', async () => {
  // Virtual mock, so that file doesn't necessarly have to exist.
  vi.doMock(join(fixturePath, 'rspack.config.js'), () => rspackConfig)

  const { dist } = prepare([
    packageJson('stats-multiple-configurations'),
    file('first.js', 'console.log("first")'),
    file('second.js', 'console.log("second")'),
    file('third.js', 'console.log("third")'),
  ])

  // Reset previous imports/mocks.
  rspackConfig.default = [
    {
      entry: { first: { import: './first.js' } },
    },
    {
      entry: { second: { import: './second.js' } },
    },
    {
      entry: { third: { import: './third.js' } },
    },
  ]
  // Required for vitest mocking to work properly.
  rspackConfig.after = undefined

  await build(false)

  const files = listFilesMatching('**/*.js', dist)

  expect(files.length).toBe(3)

  expect(consoleLogMock).toHaveBeenCalled()

  const output = consoleLogMock.mock.calls.join(EOL)

  // Three separate builds.
  expect([...output.matchAll(/Build in/g)].length).toBe(3)
  expect([...output.matchAll(/\.\/first\.js \(first\)/g)].length).toBe(1)
  expect([...output.matchAll(/\.\/second\.js \(second\)/g)].length).toBe(1)
  expect([...output.matchAll(/\.\/third\.js \(third\)/g)].length).toBe(1)
})
