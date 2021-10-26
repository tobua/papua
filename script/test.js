import { execSync } from 'child_process'
import { realpathSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import globalDirs from 'global-dirs'
import objectAssignDeep from 'object-assign-deep'
import formatJson from 'pakag'
import { log, getConfigurationFilePath } from '../utility/helper.js'
import { getProjectBasePath } from '../utility/path.js'
import { options } from '../utility/options.js'
import { cypress } from '../configuration/cypress.js'

const installCypressIfMissing = () => {
  if (existsSync(join(getProjectBasePath(), 'node_modules/cypress'))) {
    return
  }

  // Check if cypress package is installed globally (from is-installed-globally).
  if (existsSync(join(realpathSync(globalDirs.npm.packages), 'cypress'))) {
    return
  }

  if (existsSync(join(globalDirs.yarn.packages, 'cypress'))) {
    return
  }

  log('Cypress not found installing it now...')

  execSync(`npm install cypress`, { stdio: 'inherit' })
}

// Picks up user configuration from package.json -> papua.cypress field and standard cypress.json in root.
export const configureCypress = () => {
  const userConfiguration = {}
  const cypressJsonPath = join(getProjectBasePath(), 'cypress.json')

  if (existsSync(cypressJsonPath)) {
    try {
      const contents = JSON.parse(readFileSync(cypressJsonPath, 'utf8'))
      objectAssignDeep(userConfiguration, contents)
    } catch (error) {
      log(`Failed to read user cypress configuration from ${cypressJsonPath}.`, 'warning')
    }
  }

  // package.json has priority, will override cypress.json.
  if (typeof options().cypress === 'object') {
    objectAssignDeep(userConfiguration, options().cypress)
  }

  // Apply defaults.
  const configuration = cypress(userConfiguration)

  writeFileSync(
    getConfigurationFilePath('cypress.json'),
    formatJson(JSON.stringify(configuration), { sort: false })
  )
}

export const hasCypressTests = () => existsSync(join(getProjectBasePath(), 'cypress'))

export default () => {
  const hasJest = options().hasTest || existsSync(join(getProjectBasePath(), options().test))
  const hasCypress = hasCypressTests()

  const additionalArguments = process.argv.slice(3)

  if (hasJest) {
    log('running tests with jest...')
    execSync(`jest ${additionalArguments.join(' ')}`, { stdio: 'inherit' })
  }

  if (hasCypress) {
    log('running cypress...')
    installCypressIfMissing()
    configureCypress()
    execSync(`cypress open --config-file ./node_modules/papua/configuration/cypress.json`, {
      stdio: 'inherit',
    })
  }

  if (!hasJest && !hasCypress) {
    log(
      `No tests found add tests inside /${options().test} for Jest or inside /cypress for Cypress`,
      'warning'
    )
  }
}
