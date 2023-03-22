import { execSync } from 'child_process'
import { realpathSync, existsSync } from 'fs'
import { join } from 'path'
import globalDirs from 'global-dirs'
import { log } from '../utility/helper'
import { getProjectBasePath } from '../utility/path'
import { options } from '../utility/options'

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
    execSync(`cypress open --config-file ./node_modules/papua/configuration/cypress.config.js`, {
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
