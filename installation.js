import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import prettier from 'prettier'
import objectAssignDeep from 'object-assign-deep'
import configuration from './configuration/package.js'

const root = join(process.cwd(), '../..')
const packageJsonPath = join(root, 'package.json')

let packageContents = readFileSync(packageJsonPath, 'utf8')
packageContents = JSON.parse(packageContents)

// Merge existing configuration with additional required attributes.
objectAssignDeep(packageContents, configuration)

packageContents = JSON.stringify(packageContents)

// Format with prettier before writing.
packageContents = prettier.format(packageContents, {
  // Same config as npm uses for formatting upon install.
  trailingComma: 'es5',
  tabWidth: 2,
  singleQuote: true,
  parser: 'json',
  // Workaround to make sure line break applies for eslintConfig.
  printWidth: 60,
})

writeFileSync(packageJsonPath, packageContents)
