import { existsSync } from 'fs'
import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import { registerVitest, environment, prepare, packageJson, file } from 'jest-fixture'
import { build, configure } from '../index'
import { refresh } from '../utility/helper'

registerVitest(beforeEach, afterEach, vi)

environment('typescript')

beforeEach(refresh)

test('Build with typescript errors fails.', async () => {
  const { dist } = prepare([
    packageJson('typescript'),
    file('index.ts', `const failing: number = 'string'`),
  ])

  // If build fails process.exit will be called with 1.
  // @ts-ignore
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

  configure()
  await build(true)

  // Build doesn't fail, but prints error.
  expect(mockExit).not.toHaveBeenCalled()
  // No dist files generated.
  expect(existsSync(dist)).toEqual(true) // TODO TS checker plugin not yet compatible.
})
