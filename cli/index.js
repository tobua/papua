#!/usr/bin/env node

import * as scripts from '../script/index.js'
import { writeConfiguration } from '../utility/configuration.js'

let script = process.argv.slice(2)[0]

if (['start', 'build', 'test', 'lint', 'update'].includes(script)) {
  const developmentMode = script === 'start'

  // Start will be a regular build in development mode with watching and serving.
  if (script === 'start') {
    script = 'build'
  }

  writeConfiguration()

  scripts[script](developmentMode)
} else {
  console.error('Please provide a valid script.')
}
