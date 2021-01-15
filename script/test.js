import { execSync } from 'child_process'
import { realpathSync } from 'fs'
import { join } from 'path'
import isPathInside from 'is-path-inside'
import globalDirs from 'global-dirs'
import { log } from '../utility/helper.js'
import { getProjectBasePath } from '../utility/path.js'
import { options } from '../utility/options.js'

const installCypressIfMissing = () => {
  if (isPathInside('cypress', join(getProjectBasePath(), 'node_modules'))) {
    return
  }

  // Adapted from is-installed-globally
  if (isPathInside('cypress', realpathSync(globalDirs.npm.packages))) {
    return
  }

  if (isPathInside('cypress', globalDirs.yarn.packages)) {
    return
  }

  log('Cypress not found installing it now...')

  execSync(`npm install cypress`, { stdio: 'inherit' })
}

export default () => {
  const hasJest = isPathInside(options().test, getProjectBasePath())
  const hasCypress = isPathInside('cypress', getProjectBasePath())

  const additionalArguments = process.argv.slice(3)

  if (hasJest) {
    log('running tests with jest...')
    execSync(`jest ${additionalArguments.join(' ')}`, { stdio: 'inherit' })
  }

  if (hasCypress) {
    log('running cypress...')
    installCypressIfMissing()
    execSync(
      `cypress open --config-file ./node_modules/papua/configuration/cypress.json`,
      { stdio: 'inherit' }
    )
  }

  if (!hasJest && !hasCypress) {
    log(
      `No tests found add tests inside /${
        options().test
      } for Jest or inside /cypress for Cypress`,
      'warning'
    )
  }
}
