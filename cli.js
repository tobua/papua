#!/usr/bin/env node
import * as scripts from './script/index.js'
import { writeConfiguration } from './utility/configuration.js'

const script = process.argv.slice(2)[0]

if (Object.keys(scripts).includes(script)) {
  writeConfiguration()
  scripts[script]()
} else {
  console.error('Please provide a valid script.')
}
