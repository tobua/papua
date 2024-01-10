import { existsSync } from 'fs'
import { test, expect, vi } from 'vitest'
import {
  environment,
  prepare,
  packageJson,
  file,
  writeFile,
  readFile,
  contentsForFilesMatching,
} from 'jest-fixture'
import { build, configure } from '../index'

environment('typescript')

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

  // Build doesn't fail, but prints error.
  expect(mockExit).not.toHaveBeenCalled()
  // No dist files generated.
  expect(existsSync(dist)).toEqual(true) // NOTE builds even with errors.

  // Output includes TypeScript error.
  expect(
    consoleLogMock.mock.calls.some((call) =>
      call[0].includes("Type 'string' is not assignable to type 'number'."),
    ),
  ).toBe(true)
})

test('Absolute imports can be used in TypeScript.', async () => {
  const { dist } = prepare([
    packageJson('typescript-absolute'),
    file('index.tsx', `import { greeting } from 'hello/world'; console.log(greeting)`),
    file('hello/world.tsx', 'export const greeting = "HEY"'),
  ])

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

  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  expect(mainJsContents).toContain('HEY')
})
