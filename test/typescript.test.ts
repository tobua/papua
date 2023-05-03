import { existsSync } from 'fs'
import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import { registerVitest, environment, prepare, packageJson, file } from 'jest-fixture'
import { build, configure } from '../index'
import { refresh } from '../utility/helper'

process.env.PAPUA_TEST = 'true'

registerVitest(beforeEach, afterEach, vi)

environment('typescript')

beforeEach(refresh)

const consoleLogMock = vi.fn()
console.log = consoleLogMock

test('Build with typescript errors fails.', async () => {
  const { dist } = prepare([
    packageJson('typescript'),
    file('index.ts', `const failing: number = 'string'`),
  ])

  // If build fails process.exit will be called with 1.
  // @ts-ignore
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

  configure()
  await build(false)

  // Build doesn't fail, but prints error.
  expect(mockExit).not.toHaveBeenCalled()
  // No dist files generated.
  expect(existsSync(dist)).toEqual(true) // NOTE builds even with errors.

  // Output includes TypeScript error.
  expect(
    consoleLogMock.mock.calls.some((call) =>
      call[0].includes("Type 'string' is not assignable to type 'number'.")
    )
  ).toBe(true)
})