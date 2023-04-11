#!/usr/bin/env node
import * as scripts from './script/index'
import { writeConfiguration } from './utility/configuration'

const script = process.argv.slice(2)[0]

if (Object.keys(scripts).includes(script)) {
  await writeConfiguration()
  scripts[script]()
} else {
  console.error('Please provide a valid script.')
}
