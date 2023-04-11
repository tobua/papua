import { execSync } from 'child_process'
import { realpathSync, existsSync } from 'fs'
import { join } from 'path'
import globalDirs from 'global-dirs'
import { log } from '../utility/helper'
import { getProjectBasePath } from '../utility/path'
import { options } from '../utility/options'

const installIfMissing = (dependency: string) => {
  if (existsSync(join(getProjectBasePath(), `node_modules/${dependency}`))) {
    return
  }

  // Check if package is installed globally (from is-installed-globally).
  if (existsSync(join(realpathSync(globalDirs.npm.packages), dependency))) {
    return
  }

  if (existsSync(join(globalDirs.yarn.packages, dependency))) {
    return
  }

  log(`${dependency} not found installing it now with "npm install ${dependency}"...`)

  execSync(`npm install ${dependency}`, { stdio: 'inherit' })
}

export const hasCypressTests = () => existsSync(join(getProjectBasePath(), 'cypress'))

export default () => {
  const testDirectory = options().test
  const testDirectorySpecified = typeof testDirectory === 'string'
  const hasVitest =
    options().hasTest ||
    (testDirectorySpecified && existsSync(join(getProjectBasePath(), testDirectory)))
  const hasCypress = hasCypressTests()

  const additionalArguments = process.argv.slice(3)

  if (hasVitest) {
    installIfMissing('vitest')
    log('running vitest...')
    execSync(`vitest run ${additionalArguments.join(' ')}`, { stdio: 'inherit' })
  }

  if (hasCypress) {
    installIfMissing('cypress')
    log('running cypress...')
    execSync(`cypress open --config-file ./node_modules/papua/configuration/cypress.config.js`, {
      stdio: 'inherit',
    })
  }

  if (!hasVitest && !hasCypress) {
    log(
      `No tests found add tests inside /${
        options().test
      } for Vitest or inside /cypress for Cypress`,
      'warning'
    )
  }
}
