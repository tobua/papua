import { existsSync } from 'fs'
import {
  environment,
  prepare,
  packageJson,
  file,
  contentsForFilesMatching,
} from 'jest-fixture'
import { build } from '../index.js'
import { refresh } from '../utility/helper.js'

// Build can take more than 5 seconds.
jest.setTimeout(60000)

environment('module')

beforeEach(refresh)

test('Can import node modules.', async () => {
  const { dist } = prepare([
    packageJson('module'),
    file('index.js', `import 'my-module';`),
    file('node_modules/my-module/index.js', `console.log('hello');`),
  ])

  await build()

  expect(existsSync(dist)).toEqual(true)

  const jsContents = contentsForFilesMatching('*.js', dist)

  expect(jsContents.length).toEqual(1)

  // Module found in dist file.
  expect(jsContents[0].contents).toContain('hello')
})

test('Works with ES Module packages.', async () => {
  const { dist } = prepare([
    packageJson('esmodule'),
    file('index.js', `import 'my-module';`),
    file('node_modules/my-module/index.js', `import 'my-imported-module'`),
    file(
      'node_modules/my-imported-module/index.js',
      `export default console.log('hello again')`
    ),
  ])

  await build()

  expect(existsSync(dist)).toEqual(true)

  const jsContents = contentsForFilesMatching('*.js', dist)

  // Contents of imported module imported are found in bundle.
  expect(jsContents[0].contents).toContain('hello again')
})

test('Tree-shaking is applied to ES Modules.', async () => {
  const { dist } = prepare([
    packageJson('treeshaking'),
    file('index.js', `import { hello } from 'my-module'; console.log(hello)`),
    file(
      'node_modules/my-module/index.js',
      `export default 'remove-me'
  export const hello = 'keep-me'
  export const world = 'remove-me'`
    ),
  ])

  await build()

  expect(existsSync(dist)).toEqual(true)

  const jsContents = contentsForFilesMatching('*.js', dist)

  // Contents of imported module imported are found in bundle.
  expect(jsContents[0].contents).toContain('keep-me')
  expect(jsContents[0].contents).not.toContain('remove-me')
})
