import { existsSync, readFileSync } from 'fs'
// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'cypress'
import { deepmerge } from 'deepmerge-ts'
import { join } from 'path'

const importFileIfExists = async (path, readableName, warn = false) => {
  let result

  if (existsSync(path)) {
    try {
      if (path.endsWith('.json')) {
        // Dynamic import would either require assert which fails on older node versions
        // or throws ERR_UNKNOWN_FILE_EXTENSION due to JSON on older < 16.15 node.
        result = JSON.parse(readFileSync(path))
      } else {
        result = await import(path)
      }
    } catch (error) {
      if (warn) {
        console.log(error)
        console.warn(`Failed to read ${readableName} from ${path}.`)
      }
    }
  }

  // Normalize CJS and ESM.
  if (result && typeof result === 'object' && typeof result.default !== 'undefined') {
    result = result.default
  }

  return result
}

const importFileContents = async (fileName, readableName) => {
  const filePath = process.env.PAPUA_TEST
    ? join(process.cwd(), fileName)
    : join(process.cwd(), '../../..', fileName)
  const config = await importFileIfExists(filePath, readableName, !process.env.PAPUA_TEST)
  return config ?? {}
}

const userConfig = await importFileContents('cypress.config.js', 'user cypress config')
const plugin = await importFileContents(
  'cypress/plugins/index.cjs',
  'package cypress configuration'
)
const packageJson = await importFileContents('package.json', 'package.json')

let packageJsonConfig = {}

if (packageJson.papua && typeof packageJson.papua.cypress === 'object') {
  packageJsonConfig = packageJson.papua.cypress
}

const defaults = {
  chromeWebSecurity: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return plugin && plugin(on, config)
    },
    testIsolation: false,
  },
}

export default defineConfig(deepmerge(defaults, userConfig, packageJsonConfig))
