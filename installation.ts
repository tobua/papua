import { skip } from 'skip-local-postinstall'
import { log } from './utility/helper'
import { writeConfiguration } from './utility/configuration'

skip()

await writeConfiguration(true)

log('installed successfully')
