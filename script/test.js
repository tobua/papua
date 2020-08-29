import { execSync } from 'child_process'
import log from 'logua'

export default () => {
  log('running tests..')
  execSync('jest', { stdio: 'inherit' })
}
