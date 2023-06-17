import { test, expect } from 'vitest'
import { environment, prepare, packageJson, file, listFilesMatching, readFile } from 'jest-fixture'
import { eject } from '../index'

environment('eject')

test('Can eject existing installation.', async () => {
  prepare([packageJson('eject'), file('index.js', `console.log('eject')`)])

  let files = listFilesMatching('**/*', '.')

  expect(files.length).toBe(2)

  // Set inputs in order to avoid mocking prompts.
  await eject({ template: 'html', file: 'index.html' })

  files = listFilesMatching('**/*', '.')

  expect(files.length).toBe(3)
  expect(files).toContain('index.html')

  const htmlContent = readFile('index.html')

  expect(htmlContent).toContain('<body>')

  await eject({ template: 'rspack' })

  files = listFilesMatching('**/*', '.')

  expect(files.length).toBe(4)
  expect(files).toContain('rspack.config.js')

  await eject({ template: 'html', file: 'nested/template.html' })

  files = listFilesMatching('**/*', '.')

  expect(files.length).toBe(5)
  expect(files).toContain('nested/template.html')
})
