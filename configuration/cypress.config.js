import { existsSync } from 'fs'
// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'cypress'
import objectAssignDeep from 'object-assign-deep'
// eslint-disable-next-line import/no-unresolved
import packageJson from '../../../package.json' assert { type: 'json' }
import { log } from '../utility/helper.js'

const importFileContents = async (fileName, readableName) => {
  let result = {}
  const filePath = `./../../../${fileName}`

  if (existsSync(filePath)) {
    try {
      result = await import(filePath)
    } catch (error) {
      console.log(error)
      log(`Failed to read ${readableName} from ${filePath}.`, 'warning')
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
      console.log('setup', plugin)
      return plugin && plugin(on, config)
    },
  },
}

const result = objectAssignDeep(defaults, packageJsonConfig, userConfig)

export default defineConfig(result)
