import { existsSync } from 'fs'
import { build } from '../index.js'
import { environment, prepare } from './utility/prepare.js'
import { contentsForFilesMatching } from './utility/helper.js'

const [fixturePath] = environment('module')

test('Can import node modules.', async () => {
  const { dist } = prepare('module', fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)

  const jsContents = contentsForFilesMatching('*.js', dist)

  expect(jsContents.length).toEqual(1)

  // Module found in dist file.
  expect(jsContents[0].contents).toContain('hello')
})

test('Works with ES Module packages.', async () => {
  const { dist } = prepare('esmodule', fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)

  const jsContents = contentsForFilesMatching('*.js', dist)

  // Contents of imported module imported are found in bundle.
  expect(jsContents[0].contents).toContain('hello again')
})

test('Tree-shaking is applied to ES Modules.', async () => {
  const { dist } = prepare('treeshaking', fixturePath)

  await build()

  expect(existsSync(dist)).toEqual(true)

  const jsContents = contentsForFilesMatching('*.js', dist)

  // Contents of imported module imported are found in bundle.
  expect(jsContents[0].contents).toContain('keep-me')
  expect(jsContents[0].contents).not.toContain('remove-me')
})
