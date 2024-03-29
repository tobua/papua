import { join, sep } from 'path'
import { environment, prepare, packageJson, file, readFile, writeFile } from 'jest-fixture'
import { test, expect, beforeAll, afterAll, vi } from 'vitest'
import lint from '../script/lint'
import { writeConfiguration } from '../utility/configuration'

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

const consoleLogMock = vi.fn()
console.log = consoleLogMock

test('Basic check of all three linters.', async () => {
  const initialIndexJs = `import { styles, unused } from './cli.js'; const method = (value) => value * 2; console.log('test',method(), styles); const longArguments = (firstLongArgument, secondLongArgument, thirdLongArgument, lastLongArgument) => null`

  prepare([
    packageJson('lint'),
    file('index.js', initialIndexJs),
    file(
      'cli.js',
      `const css = () => {}
const styled = {}

export const styles = {}
export const unused = {}

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

console.log(first, second)`,
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
  expect(formattedIndexJs).not.toContain(':') // semi: false
  expect(formattedIndexJs).toContain('lastLongArgument,') // Trailing comman for multiple line arguments
  expect(formattedIndexJs).toContain("'test', method()") // Space added
  // Remove unused exports (eslint-plugin)
  expect(formattedIndexJs).toContain('{ styles }')
  expect(formattedIndexJs).not.toContain('unused')

  // NOTE might be failing due to debug statements...
  expect(consoleLogMock.mock.calls.length).toEqual(5)

  // ESLint
  const eslintMessages = consoleLogMock.mock.calls[3][0]

  expect(eslintMessages).toContain('no-unused-vars')
  expect(eslintMessages).toContain('no-console')
  expect(eslintMessages).toContain('warning')
  expect(eslintMessages).toContain('error')
  expect(eslintMessages).toContain(`${sep}cli.js`)
  expect(eslintMessages).toContain(`${sep}index.js`)

  // Stylelint
  const stylelintMessages = consoleLogMock.mock.calls[4][0]

  expect(stylelintMessages).toContain('Unexpected unknown unit "fh"')
  expect(stylelintMessages).toContain('2 errors found')
}, 10000)
