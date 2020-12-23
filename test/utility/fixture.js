import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import rimraf from 'rimraf'
import { writeFile } from './file.js'
import * as structures from './structures.js'

// Access directory, before it's modified for tests.
const CWD = process.cwd()

// Create file structure required to test the plugins.
export const setup = (structureName, fixturePath) => {
  // Cleanup in case leftovers from previous runs exist.
  rimraf.sync(fixturePath)

  // Create test/fixture directory to put files.
  mkdirSync(fixturePath, { recursive: true })

  const structure =
    typeof structureName === 'object'
      ? structureName
      : structures[structureName]

  structure.forEach((file) => {
    const filePath = join(fixturePath, file.name)
    const fileDirectory = dirname(filePath)

    if (!existsSync(fileDirectory)) {
      mkdirSync(fileDirectory, { recursive: true })
    }

    if (file.copy) {
      copyFileSync(join(CWD, 'test/assets', file.copy), filePath)
    } else {
      writeFile(filePath, file.contents, {
        json: file.json,
      })
    }
  })
}

// Remove temporary files inside fixtures created during tests.
export const reset = (fixturePath) => {
  rimraf.sync(join(fixturePath, 'dist'))
}

// Remove test suites created during setup.
export const remove = (fixturePath) => {
  rimraf.sync(fixturePath)
}
