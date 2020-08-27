import { execSync } from 'child_process'
import { log } from '../utility/log.js'

export default () => {
  log('running tests..')
  execSync('jest', { stdio: 'inherit' })
}
