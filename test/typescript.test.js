import { existsSync } from 'fs'
import { environment, prepare, packageJson, file } from 'jest-fixture'
import { build, configure } from '../index.js'
import { refresh } from '../utility/helper.js'

// Build can take more than 5 seconds.
jest.setTimeout(60000)

environment('typescript')

beforeEach(refresh)

test('Build with typescript errors fails.', async () => {
  const { dist } = prepare([
    packageJson('typescript'),
    file('index.ts', `const failing: number = 'string'`),
  ])

  // If build fails process.exit will be called with 1.
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

  configure()
  await build()

  // Build doesn't fail, but prints error.
  expect(mockExit).not.toHaveBeenCalled()
  // No dist files generated.
  expect(existsSync(dist)).toEqual(false)
})
