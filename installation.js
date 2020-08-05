import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import objectAssignDeep from 'object-assign-deep'
import configuration from './configuration/package.js'
import { formatJson } from './utility/format-json.js'

const packageJsonPath = join(process.cwd(), '../../package.json')

let packageContents = readFileSync(packageJsonPath, 'utf8')
packageContents = JSON.parse(packageContents)

// Merge existing configuration with additional required attributes.
objectAssignDeep(packageContents, configuration)

packageContents = JSON.stringify(packageContents)

// Format with prettier before writing.
packageContents = formatJson(packageContents)

writeFileSync(packageJsonPath, packageContents)
