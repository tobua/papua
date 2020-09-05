import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import objectAssignDeep from 'object-assign-deep'
import formatPackageJson from 'pakag'
import skip from 'skip-local-postinstall'
import configuration from './configuration/package.js'

skip()

const packageJsonPath = join(process.cwd(), '../../package.json')

let packageContents = readFileSync(packageJsonPath, 'utf8')
packageContents = JSON.parse(packageContents)

// Merge existing configuration with additional required attributes.
objectAssignDeep(packageContents, configuration)

packageContents = JSON.stringify(packageContents)

// Format with prettier before writing.
packageContents = formatPackageJson(packageContents)

writeFileSync(packageJsonPath, packageContents)
