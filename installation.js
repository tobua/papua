import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import objectAssignDeep from 'object-assign-deep'
import formatPackageJson from 'pakag'
import configuration from './configuration/package.js'

// Skip postinstall on local install.
// https://stackoverflow.com/a/53239387/3185545
const env = process.env
if (env.INIT_CWD === env.PWD || env.INIT_CWD.indexOf(env.PWD) === 0) {
  console.info('Skipping `postinstall` script on local installs')
  process.exit(0)
}

const packageJsonPath = join(process.cwd(), '../../package.json')

let packageContents = readFileSync(packageJsonPath, 'utf8')
packageContents = JSON.parse(packageContents)

// Merge existing configuration with additional required attributes.
objectAssignDeep(packageContents, configuration)

packageContents = JSON.stringify(packageContents)

// Format with prettier before writing.
packageContents = formatPackageJson(packageContents)

writeFileSync(packageJsonPath, packageContents)
