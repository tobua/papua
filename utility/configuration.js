import {
  accessSync,
  existsSync,
  constants,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from 'fs'
import { join } from 'path'
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
import { webpackServer } from '../configuration/webpack-server.js'
import snowpackConfig from '../configuration/snowpack.js'
import { log, isPlugin } from './helper.js'
import { options } from './options.js'
import { getProjectBasePath } from './path.js'

// Merges the default webpack config with user additions.
export const loadWebpackConfig = async (development, watch) => {
  let configuration = webpackConfig(development, watch)
  configuration.devServer = webpackServer()

  let userConfiguration = {}

  try {
    // Works with module.exports = {} and export default {}.
    // The latter only if type in project is set to ES Modules.
    userConfiguration = await import(
      join(getProjectBasePath(), './webpack.config.js')
    )

    if (userConfiguration.default) {
      userConfiguration = userConfiguration.default
    }
  } catch (error) {
    // No user configuration found.
  }

  // User configuration can be a function and will receive the default config and the environment.
  if (typeof userConfiguration === 'function') {
    userConfiguration = userConfiguration(configuration, development)
  }

  // With clone plugins etc. (non-serializable properties) will be gone.
  configuration = merge(configuration, userConfiguration, { clone: false })

  const devServerConfiguration = configuration.devServer
  delete configuration.devServer

  return [configuration, devServerConfiguration]
}

export const loadSnowpackConfig = async () => {
  let configuration = await snowpackConfig()
  let userConfiguration = {}

  try {
    // Works with module.exports = {} and export default {}.
    // The latter only if type in project is set to ES Modules.
    userConfiguration = await import(
      join(getProjectBasePath(), './snowpack.config.js')
    )

    if (userConfiguration.default) {
      userConfiguration = userConfiguration.default
    }
  } catch (error) {
    // User configuration is optional.
  }

  // User configuration can be a function and will receive the default config and the environment.
  if (typeof userConfiguration === 'function') {
    userConfiguration = userConfiguration(configuration)
  }

  configuration = merge(configuration, userConfiguration, { clone: false })

  return configuration
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
    const emptyBasePackagePath = '../../..'
    const baseFromPackagePath = '../../../'
    if (typeof value === 'string' && value.includes(baseFromPackagePath)) {
      // eslint-disable-next-line no-param-reassign
      subject[key] = value.replace(baseFromPackagePath, '')
    }
    if (typeof value === 'string' && value.includes(emptyBasePackagePath)) {
      // eslint-disable-next-line no-param-reassign
      subject[key] = value.replace(emptyBasePackagePath, '.')
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
    const mergedUserConfig = merge(userConfig, packageConfig, { clone: false })
    writeFileSync(
      userTSConfigPath,
      formatJson(JSON.stringify(mergedUserConfig), { sort: false })
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

export const writeTSConfig = (tsConfigUserOverrides = {}) => {
  writePackageAndUserFile(
    !options().typescript,
    'tsconfig.json',
    tsconfig,
    tsConfigUserOverrides
  )
}

export const writeJSConfig = (jsConfigUserOverrides = {}) => {
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

export const writePackageJson = (postinstall) => {
  const packageJsonPath = join(getProjectBasePath(), './package.json')

  if (!existsSync(packageJsonPath)) {
    writeFileSync(packageJsonPath, `{\n}\n`)
  }

  let packageContents = readFileSync(packageJsonPath, 'utf8')
  packageContents = JSON.parse(packageContents)

  if (postinstall && isPlugin(packageContents)) {
    return { packageContents }
  }

  const generatedPackageJson = packageJson()

  // Merge existing configuration with additional required attributes.
  // Existing properties override generated configuration to allow
  // the user to configure it their way.
  objectAssignDeep(generatedPackageJson, packageContents)

  // Format with prettier and sort before writing.
  writeFileSync(
    packageJsonPath,
    formatJson(JSON.stringify(generatedPackageJson))
  )

  if (!generatedPackageJson.papua) {
    generatedPackageJson.papua = {}
  }

  return { packageContents: generatedPackageJson }
}

export const writeConfiguration = (postinstall) => {
  const { packageContents } = writePackageJson(postinstall)

  // Skip modifying the project in case it's being installed for later programmatic use by a plugin.
  if (postinstall && isPlugin(packageContents)) {
    return null
  }

  writeJSConfig(packageContents.papua.jsconfig)
  writeTSConfig(packageContents.papua.tsconfig)
  writeGitIgnore(packageContents.papua.gitignore)

  return { packageContents }
}
