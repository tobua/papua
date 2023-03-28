import { existsSync, readFileSync } from 'fs'
// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'cypress'
import merge from 'deepmerge'

const importFileContents = async (fileName, readableName) => {
  let result = {}
  const filePath = `./../../../${fileName}`

  if (existsSync(filePath)) {
    try {
      if (filePath.endsWith('.json')) {
        // Dynamic import would either require assert which fails on older node versions
        // or throws ERR_UNKNOWN_FILE_EXTENSION due to JSON on older < 16.15 node.
        result = JSON.parse(readFileSync(filePath))
      } else {
        result = await import(filePath)
      }
    } catch (error) {
      console.log(error)
      console.warn(`Failed to read ${readableName} from ${filePath}.`)
    }
  }

  // Normalize CJS and ESM.
  if (typeof result === 'object' && typeof result.default !== 'undefined') {
    result = result.default
  }

  return result
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

let result = merge(defaults, packageJsonConfig, { clone: false })
result = merge(result, userConfig, { clone: false })

export default defineConfig(result)
