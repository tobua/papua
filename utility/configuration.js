import {
  accessSync,
  existsSync,
  constants,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from 'fs'
import { resolve, join } from 'path'
import merge from 'deepmerge'
import formatJson from 'pakag'
import objectAssignDeep from 'object-assign-deep'
import deepForEach from 'deep-for-each'
import parse from 'parse-gitignore'
import { tsconfig } from '../configuration/tsconfig.js'
import { jsconfig } from '../configuration/jsconfig.js'
import { packageJson } from '../configuration/package.js'
import { gitignore } from '../configuration/gitignore.js'
import webpackConfig from '../configuration/webpack.js'
import webpackServerConfiguration from '../configuration/webpack-server.js'
import { log } from './helper.js'
import { options } from './options.js'
import { getProjectBasePath } from './path.js'

// Merges the default webpack config with user additions.
export const loadWebpackConfig = async (development) => {
  let configuration = webpackConfig(development)

  configuration.devServer = webpackServerConfiguration

  let userConfiguration = {}

  try {
    // Works with module.exports = {} and export default {}.
    // The latter only if type in project is set to ES Modules.
    userConfiguration = await import(
      resolve(process.cwd(), './webpack.config.js')
    )

    if (userConfiguration.default) {
      userConfiguration = userConfiguration.default
    }
  } catch (error) {
    // No user configuration found.
  }

  // User configuration can be a function and will receive the default config and the environment.
  if (typeof userConfig === 'function') {
    userConfiguration = userConfiguration(configuration, development)
  }

  // Without clone plugins etc. will be gone.
  configuration = merge(configuration, userConfiguration, { clone: false })

  const devServerConfiguration = configuration.devServer
  delete configuration.devServer

  return [configuration, devServerConfiguration]
}

const writeUserAndPackageConfig = (
  filename,
  userConfig,
  packageConfig,
  userTSConfigPath,
  packageTSConfigPath
) => {
  try {
    writeFileSync(
      packageTSConfigPath,
      formatJson(JSON.stringify(packageConfig), { sort: false })
    )
    writeFileSync(
      userTSConfigPath,
      formatJson(JSON.stringify(userConfig), { sort: false })
    )
  } catch (_) {
    log(
      `Couldn't write ${filename}, therefore this plugin might not work as expected`,
      'warning'
    )
  }
}

// remove ../../.. to place config in project root.
const adaptConfigToRoot = (packageConfig) => {
  deepForEach(packageConfig, (value, key, subject) => {
    const baseFromPackagePath = '../../../'
    if (typeof value === 'string' && value.includes(baseFromPackagePath)) {
      // eslint-disable-next-line no-param-reassign
      subject[key] = value.replace(baseFromPackagePath, '')
    }
  })
}

const writeOnlyUserConfig = (
  filename,
  userConfig,
  packageConfig,
  userTSConfigPath
) => {
  try {
    // eslint-disable-next-line no-param-reassign
    delete userConfig.extends
    adaptConfigToRoot(packageConfig)
    Object.assign(userConfig, packageConfig)
    writeFileSync(
      userTSConfigPath,
      formatJson(JSON.stringify(userConfig), { sort: false })
    )
  } catch (_) {
    log(
      `Couldn't write ${filename}, therefore this plugin might not work as expected`,
      'warning'
    )
  }
}

const writePackageAndUserFile = (
  shouldRemove,
  filename,
  getConfiguration,
  userConfigOverrides
) => {
  const userTSConfigPath = join(getProjectBasePath(), `./${filename}`)
  const packageTSConfigPath = join(
    getProjectBasePath(),
    `./node_modules/papua/configuration/${filename}`
  )

  if (shouldRemove) {
    if (existsSync(userTSConfigPath)) {
      unlinkSync(userTSConfigPath)
    }

    return
  }

  const [userConfig, packageConfig] = getConfiguration(userConfigOverrides)

  try {
    // If package tsconfig can be written, adapt it and only extend user config.
    accessSync(
      packageTSConfigPath,
      // eslint-disable-next-line no-bitwise
      constants.F_OK | constants.R_OK | constants.W_OK
    )
    writeUserAndPackageConfig(
      filename,
      userConfig,
      packageConfig,
      userTSConfigPath,
      packageTSConfigPath
    )
  } catch (_) {
    // Package config cannot be written, write full contents to user file.
    writeOnlyUserConfig(filename, userConfig, packageConfig, userTSConfigPath)
  }
}

const writeTSConfig = (tsConfigUserOverrides = {}) => {
  writePackageAndUserFile(
    !options().typescript,
    'tsconfig.json',
    tsconfig,
    tsConfigUserOverrides
  )
}

const writeJSConfig = (jsConfigUserOverrides = {}) => {
  writePackageAndUserFile(
    options().typescript,
    'jsconfig.json',
    jsconfig,
    jsConfigUserOverrides
  )
}

export const writeGitIgnore = (gitIgnoreOverrides = []) => {
  const gitIgnorePath = join(getProjectBasePath(), '.gitignore')
  let entries = []

  if (existsSync(gitIgnorePath)) {
    entries = entries.concat(parse(readFileSync(gitIgnorePath, 'utf8')))
  }

  entries = entries.concat(gitignore(gitIgnoreOverrides))

  // Remove duplicates, add empty line at the end
  entries = [...new Set(entries), '']

  writeFileSync(gitIgnorePath, entries.join('\r\n'))
}

const writePackageJson = () => {
  const packageJsonPath = join(getProjectBasePath(), './package.json')

  let packageContents = readFileSync(packageJsonPath, 'utf8')
  packageContents = JSON.parse(packageContents)

  // Merge existing configuration with additional required attributes.
  objectAssignDeep(packageContents, packageJson())

  // Format with prettier and sort before writing.
  writeFileSync(packageJsonPath, formatJson(JSON.stringify(packageContents)))

  if (!packageContents.papua) {
    packageContents.papua = {}
  }

  return { packageContents }
}

export const writeConfiguration = () => {
  const { packageContents } = writePackageJson()
  writeJSConfig(packageContents.papua.jsconfig)
  writeTSConfig(packageContents.papua.tsconfig)
  writeGitIgnore(packageContents.papua.gitignore)
  return { packageContents }
}
