import skip from 'skip-local-postinstall'
import { log } from './utility/helper.js'
import { writeConfiguration } from './utility/configuration.js'

skip()

writeConfiguration(true)

log('installed successfully')
