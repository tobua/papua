import { mkdirSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'
import { writeFile } from './file.js'
import * as structures from './structures.js'

// Access directory, before it's modified for tests.
const CWD = process.cwd()

// Create file structure required to test the plugins.
export const setup = (structureName) => {
  const BASE = join(CWD, 'test/fixture', structureName)

  // Cleanup in case leftovers from previous runs exist.
  rimraf.sync(BASE)

  // Create test/fixture directory to put files.
  mkdirSync(BASE, { recursive: true })

  structures[structureName].forEach((file) => {
    writeFile(join(BASE, file.name), file.contents, {
      json: file.json,
    })
  })

  return BASE
}

// Remove temporary files inside fixtures created during tests.
export const reset = (BASE) => {
  rimraf.sync(join(BASE, 'dist'))
}

// Remove test suites created during setup.
export const remove = (BASE) => {
  rimraf.sync(BASE)
}
