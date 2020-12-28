import { execSync } from 'child_process'
import { log } from '../utility/helper.js'

export default () => {
  const additionalArguments = process.argv.slice(3)
  log('running tests..')
  execSync(`jest ${additionalArguments.join(' ')}`, { stdio: 'inherit' })
}
