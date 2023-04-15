import { join } from 'path'
import {
  registerVitest,
  environment,
  prepare,
  packageJson,
  file,
  readFile,
  writeFile,
} from 'jest-fixture'
import { test, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import lint from '../script/lint'
import { refresh } from '../utility/helper'
import { writeConfiguration } from '../utility/configuration'

process.env.PAPUA_TEST = 'true'

registerVitest(beforeEach, afterEach, vi)

const initialCwd = process.cwd()
let packageContents = {}

// Remove configuration entries from main package, as it would
// otherwise be picked up, since it's closer to the root.
beforeAll(() => {
  packageContents = readFile('package.json')
  const copy: any = { ...packageContents }
  delete copy.eslintConfig
  delete copy.prettier

  writeFile(join(initialCwd, 'package.json'), copy)
})

// Restore initial project package.json.
afterAll(() => {
  writeFile(join(initialCwd, 'package.json'), packageContents)
})

const eslintConfig = readFile('configuration/eslint.cjs')
const prettierConfig = readFile('configuration/.prettierrc.json')
const prettierIgnore = readFile('configuration/.prettierignore')
const stylelintConfig = readFile('configuration/stylelint.cjs')

environment('lint')

beforeEach(refresh)

const consoleLogMock = vi.fn()
console.log = consoleLogMock

test('Basic check of all three linters.', async () => {
  const initialIndexJs = `import { styles } from './cli.js'; console.log('test')`

  prepare([
    packageJson('lint'),
    file('index.js', initialIndexJs),
    file(
      'cli.js',
      `const css = () => {}
const styled = {}

// Mock styled-components with @emotion
const first = styled.div\`
  display: flex;
  justify-content: whatever;
  height: 4fh;
\`

// Mock for inline styles
const second = css\`
  display: error;
  height: 4fh;
\`

console.log(first, second)`
    ),
    file('node_modules/papua/configuration/eslint.cjs', eslintConfig),
    file('node_modules/papua/configuration/.prettierrc.json', prettierConfig),
    file('node_modules/papua/configuration/.prettierignore', prettierIgnore),
    file('node_modules/papua/configuration/stylelint.cjs', stylelintConfig),
  ])

  await writeConfiguration(false)
  await lint()

  const formattedIndexJs = readFile('index.js')

  // Prettier
  expect(initialIndexJs).not.toContain('\n')
  expect(formattedIndexJs).toContain('\n')

  // NOTE might be failing due to debug statements...
  expect(consoleLogMock.mock.calls.length).toEqual(5)

  // ESLint
  const eslintMessages = consoleLogMock.mock.calls[3][0]

  expect(eslintMessages).toContain('no-unused-vars')
  expect(eslintMessages).toContain('no-console')
  expect(eslintMessages).toContain('warning')
  expect(eslintMessages).toContain('error')
  expect(eslintMessages).toContain('/cli.js')
  expect(eslintMessages).toContain('/index.js')

  // Stylelint
  const stylelintMessages = consoleLogMock.mock.calls[4][0]

  expect(stylelintMessages).toContain('Unexpected unknown unit "fh"')
  expect(stylelintMessages).toContain('2 errors found')
}, 10000)
