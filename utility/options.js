import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import log from 'logua'
import formatPackageJson from 'pakag'

let optionsCache

// Extend tsconfig with default configuration.
const extendTSConfig = (contents, packagePath, projectPath) => {
  // This way extends will be the property at the top.
  delete contents.extends
  let newTSConfig = {
    extends: packagePath,
    ...contents,
  }

  newTSConfig = JSON.stringify(newTSConfig)

  newTSConfig = formatPackageJson(newTSConfig, { sort: false })

  try {
    writeFileSync(projectPath, newTSConfig)
  } catch (_) {
    log(`Unable to extend TSConfig in ${projectPath}`, 'warning')
  }
}

// Extend project TSConfig with package TSConfig defaults.
const verifyTSConfig = (projectPath, packagePath) => {
  let tsConfigContents = {}

  try {
    tsConfigContents = JSON.parse(readFileSync(projectPath, 'utf8'))
  } catch (_) {
    log(`Unable to read TSConfig in ${projectPath}`, 'warning')
  }

  if (!tsConfigContents.extends || tsConfigContents.extends !== packagePath) {
    extendTSConfig(tsConfigContents, packagePath, projectPath)
  }
}

// Find location of applicable TSConfig.
const findTSConfig = () => {
  const projectPath = join(process.cwd(), 'tsconfig.json')
  const packagePath = './node_modules/papua/configuration/tsconfig.json'

  if (existsSync(projectPath)) {
    verifyTSConfig(projectPath, packagePath)
    return projectPath
  }

  return packagePath
}

// Get the options for this project, either from the filesystem or explicit configuration.
export const getProjectOptions = () => {
  if (optionsCache) {
    return optionsCache
  }

  const packageJsonPath = join(process.cwd(), 'package.json')

  let packageJson = {}

  try {
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  } catch (error) {
    log('package.json not found or not readable', 'error')
  }

  const options = packageJson.papua || {}

  // Entries

  let entries = []

  if (options.entry) {
    if (typeof options.entry === 'string') {
      entries.push(options.entry)
    }

    if (typeof options.entry !== 'string' && Array.isArray(options.entry)) {
      entries = options.entry
    }

    if (entries.length < 1) {
      log('Please provide at least one entry', 'error')
    }
  }

  if (entries.length === 0) {
    const defaultEntries = [
      './index.js',
      './index.jsx',
      './index.ts',
      './index.tsx',
    ]

    defaultEntries.forEach((entry) => {
      if (existsSync(join(process.cwd(), entry))) {
        entries.push(entry)
      }
    })
  }

  if (entries.length === 0) {
    log(
      'No entry file found, please add index.js, index.ts or configure the entry file in package.json',
      'error'
    )
  }

  delete options.entry

  options.entries = entries

  // JS / TS

  options.js = entries.some((entry) => /\.jsx?$/g.test(entry))
  options.ts = entries.some((entry) => /\.tsx?$/g.test(entry))

  if (options.js && options.ts) {
    log(
      'Both JavaScript and TypeScript entries found, please only use one',
      'error'
    )
  }

  // TS Config
  if (options.ts) {
    options.tsconfigPath = findTSConfig()
  }

  optionsCache = options

  return options
}
