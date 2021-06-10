import { join } from 'path'
import {
  environment,
  prepare,
  packageJson,
  file,
  readFile,
  writeFile,
} from 'jest-fixture'
// Direct import to avoid loading snowpack, which requires setImmediate from node testEnvironment.
import lint from '../script/lint.js'
import { refresh } from '../utility/helper.js'
import { writeConfiguration } from '../utility/configuration.js'

// Build can take more than 5 seconds.
jest.setTimeout(60000)

const initialCwd = process.cwd()
let packageContents = {}

// Remove configuration entries from main package, as it would
// otherwise be picked up, since it's closer to the root.
beforeAll(() => {
  packageContents = readFile('package.json')
  const copy = { ...packageContents }
  delete copy.eslintConfig
  delete copy.prettier

  writeFile(join(initialCwd, 'package.json'), copy)
})

// Restore initial project package.json.
afterAll(() => {
  writeFile(join(initialCwd, 'package.json'), packageContents)
})

let eslintConfig = readFile('configuration/eslint.cjs')
const prettierConfig = readFile('configuration/.prettierrc.json')
const prettierIgnore = readFile('configuration/.prettierignore')
const stylelintConfig = readFile('configuration/stylelint.cjs')

// babelrc defined in eslintconfig is looked up from root in tests.
eslintConfig = eslintConfig.replace(
  './node_modules/papua/configuration/.babelrc',
  './configuration/.babelrc'
)

environment('lint')

beforeEach(refresh)

console.log = jest.fn()

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

  writeConfiguration()
  await lint()

  const formattedIndexJs = readFile('index.js')

  // Prettier
  expect(initialIndexJs).not.toContain('\n')
  expect(formattedIndexJs).toContain('\n')

  expect(console.log.mock.calls.length).toEqual(5)

  // ESLint
  const eslintMessages = console.log.mock.calls[3][0]

  expect(eslintMessages).toContain('no-unused-vars')

  // Stylelint
  // TODO does not yet work in test environment.
  // Finds files in fixture but looks at contents in root.
  const stylelintMessages = console.log.mock.calls[4][0]

  console.warn(stylelintMessages)
})
