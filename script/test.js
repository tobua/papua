import { execSync } from 'child_process'
import { log } from '../utility/helper.js'

export default () => {
  log('running tests..')
  execSync('jest', { stdio: 'inherit' })
}
