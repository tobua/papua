import { accessSync, existsSync, constants, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
// import merge from 'deepmerge'
import formatJson from 'pakag'
import merge from 'deepmerge'
import { MultiRspackOptions, RspackOptions } from '@rspack/core'
import parse from 'parse-gitignore'
import { tsconfig } from '../configuration/tsconfig.js'
import { jsconfig } from '../configuration/jsconfig.js'
import { packageJson } from '../configuration/package'
import { gitignore } from '../configuration/gitignore'
import rspackConfig from '../configuration/rspack'
// import webpackConfig from '../configuration/webpack'
// import { webpackServer } from '../configuration/webpack-server'
// import { html } from '../configuration/webpack-html'
import { log, isPlugin, getConfigurationFilePath, deepForEach } from './helper'
import { options } from './options'
import { getProjectBasePath, getWorkspacePaths } from './path'

type UserConfiguration = RspackOptions & { after?: Function }

const createSingleRspackConfiguration = (
  baseConfiguration: RspackOptions,
  userConfiguration: UserConfiguration,
  afterMergeConfiguration
) => {
  // let configuration = webpackConfig(development)
  // configuration.devServer = webpackServer()

  // With clone plugins etc. (non-serializable properties) will be gone.
  let configuration = merge(baseConfiguration, userConfiguration, { clone: false })

  // Allows the user to configure different html templates.
  // if (userConfiguration.html !== false && (options().html !== false || index > 0)) {
  //   configuration.plugins.unshift(html(userConfiguration.html || options().html))
  // }

  // delete configuration.html

  // Apply user edits.
  if (afterMergeConfiguration) {
    const resultingConfiguration = afterMergeConfiguration(configuration)
    // If no return value assume in place edits without return.
    if (typeof resultingConfiguration === 'object') {
      configuration = resultingConfiguration
    }
  }

  return configuration as unknown as MultiRspackOptions
}

// const createMultipleWebpackConfigurations = (
//   userConfigurations,
//   development,
//   afterMergeConfiguration
// ) => {
//   const configurations = userConfigurations.map((userConfiguration, index) =>
//     createSingleWebpackConfiguration(userConfiguration, development, afterMergeConfiguration, index)
//   )

//   return configurations
// }

export const loadRspackConfig = async (development: boolean) => {
  let userConfiguration: UserConfiguration & { default?: any } = {}
  let afterMergeConfiguration
  const userConfigurationPath = join(getProjectBasePath(), 'rspack.config.js')
  const windowsFileProtocol = process.platform === 'win32' ? 'file://' : ''

  try {
    // Works with module.exports = {} and export default {}.
    // The latter only if type in project is set to ES Modules.
    userConfiguration = await import(`${windowsFileProtocol}${userConfigurationPath}`)

    if (userConfiguration.after && typeof userConfiguration.after === 'function') {
      afterMergeConfiguration = userConfiguration.after
    }

    if (userConfiguration.default) {
      userConfiguration = userConfiguration.default
    }
  } catch (error) {
    if (existsSync(userConfigurationPath)) {
      log(`Failed to import user rspack configuration in ${userConfigurationPath}`, 'warning')
    }

    // Ignore, no user configuration found.
  }

  const baseConfiguration = rspackConfig(development)

  // User configuration can be a function and will receive the default config and the environment.
  if (typeof userConfiguration === 'function') {
    // @ts-ignore
    userConfiguration = userConfiguration(baseConfiguration, development)
  }

  // TODO array configurations
  // if (!Array.isArray(userConfiguration)) {
  const configuration = createSingleRspackConfiguration(
    baseConfiguration,
    userConfiguration,
    afterMergeConfiguration
  )
  // } else {
  //   configuration = createMultipleWebpackConfigurations(
  //     userConfiguration,
  //     development,
  //     afterMergeConfiguration
  //   )
  // }

  const devServerConfiguration = null

  // const devServerConfiguration = Array.isArray(configuration)
  //   ? configuration[0].devServer
  //   : configuration.devServer

  // if (Array.isArray(configuration)) {
  //   configuration.forEach((currentConfiguration) => delete currentConfiguration.devServer)
  // } else {
  //   delete configuration.devServer
  // }

  return [configuration, devServerConfiguration]
}

// Merges the default webpack config with user additions.
// export const loadWebpackConfig = async (development) => {
//   let userConfiguration = {}
//   let afterMergeConfiguration
//   const userConfigurationPath = join(getProjectBasePath(), 'webpack.config.js')
//   const windowsFileProtocol = process.platform === 'win32' ? 'file://' : ''

//   try {
//     // Works with module.exports = {} and export default {}.
//     // The latter only if type in project is set to ES Modules.
//     userConfiguration = await import(`${windowsFileProtocol}${userConfigurationPath}`)

//     if (userConfiguration.after && typeof userConfiguration.after === 'function') {
//       afterMergeConfiguration = userConfiguration.after
//     }

//     if (userConfiguration.default) {
//       userConfiguration = userConfiguration.default
//     }
//   } catch (error) {
//     if (existsSync(userConfigurationPath)) {
//       log(`Failed to import user webpack configuration in ${userConfigurationPath}`, 'warning')
//     }

//     // Ignore, no user configuration found.
//   }

//   // User configuration can be a function and will receive the default config and the environment.
//   if (typeof userConfiguration === 'function') {
//     userConfiguration = userConfiguration(webpackConfig(development), development)
//   }

//   let configuration

//   if (!Array.isArray(userConfiguration)) {
//     configuration = createSingleWebpackConfiguration(
//       userConfiguration,
//       development,
//       afterMergeConfiguration
//     )
//   } else {
//     configuration = createMultipleWebpackConfigurations(
//       userConfiguration,
//       development,
//       afterMergeConfiguration
//     )
//   }

//   const devServerConfiguration = Array.isArray(configuration)
//     ? configuration[0].devServer
//     : configuration.devServer

//   if (Array.isArray(configuration)) {
//     configuration.forEach((currentConfiguration) => delete currentConfiguration.devServer)
//   } else {
//     delete configuration.devServer
//   }

//   return [configuration, devServerConfiguration]
// }

const writeUserAndPackageConfig = (
  filename: string,
  userConfig: object,
  packageConfig: object,
  userTSConfigPath: string,
  packageTSConfigPath: string
) => {
  try {
    writeFileSync(packageTSConfigPath, formatJson(JSON.stringify(packageConfig), { sort: false }))
    writeFileSync(userTSConfigPath, formatJson(JSON.stringify(userConfig), { sort: false }))
  } catch (_) {
    log(`Couldn't write ${filename}, therefore this plugin might not work as expected`, 'warning')
  }
}

// remove ../../.. to place config in project root.
const adaptConfigToRoot = (packageConfig: object) => {
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
  filename: string,
  userConfig: any,
  packageConfig: object,
  userTSConfigPath: string
) => {
  try {
    // eslint-disable-next-line no-param-reassign
    delete userConfig.extends
    adaptConfigToRoot(packageConfig)
    const mergedUserConfig = merge(userConfig, packageConfig, { clone: false })
    writeFileSync(userTSConfigPath, formatJson(JSON.stringify(mergedUserConfig), { sort: false }))
  } catch (_) {
    log(`Couldn't write ${filename}, therefore this plugin might not work as expected`, 'warning')
  }
}

const writePackageAndUserFile = (
  shouldRemove: boolean,
  filename: string,
  getConfiguration: Function,
  userConfigOverrides: object
) => {
  const userTSConfigPath = join(getProjectBasePath(), `./${filename}`)
  const packageTSConfigPath = getConfigurationFilePath(filename)

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
  writePackageAndUserFile(!options().typescript, 'tsconfig.json', tsconfig, tsConfigUserOverrides)
}

export const writeJSConfig = (jsConfigUserOverrides = {}) => {
  writePackageAndUserFile(options().typescript, 'jsconfig.json', jsconfig, jsConfigUserOverrides)
}

export const writeGitIgnore = (gitIgnoreUserOverrides: string[] = []) => {
  const gitIgnorePath = join(getProjectBasePath(), '.gitignore')
  let entries = []

  if (existsSync(gitIgnorePath)) {
    // @ts-ignore
    const existingGitignoreLines = parse(readFileSync(gitIgnorePath, 'utf8')).patterns
    entries = entries.concat(existingGitignoreLines)
  }

  entries = entries.concat(gitignore(gitIgnoreUserOverrides))

  // Remove duplicates, add empty line at the end
  entries = [...new Set(entries), '']

  writeFileSync(gitIgnorePath, entries.join('\r\n'))
}

export const removePropertiesToUpdate = (pkg) => {
  if (typeof pkg.engines === 'object') {
    delete pkg.engines.node
  }

  // TODO still necessary?
  if (typeof pkg.stylelint === 'object') {
    // Switches from JS to CJS (JS file no longer available).
    delete pkg.stylelint.extends
  }
}

export const writePackageJson = async (postinstall: boolean, workspacePath = '.') => {
  const packageJsonPath = join(getProjectBasePath(), workspacePath, './package.json')

  if (!existsSync(packageJsonPath)) {
    writeFileSync(packageJsonPath, `{\n}\n`)
  }

  const packageContents = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

  if (postinstall && isPlugin(packageContents)) {
    return { packageContents }
  }

  const generatedPackageJson = packageJson()

  // Remove properties that should be kept up-to-date.
  removePropertiesToUpdate(packageContents)

  // Merge existing configuration with additional required attributes.
  // Existing properties override generated configuration to allow
  // the user to configure it their way.
  const mergedPackageJson = merge(generatedPackageJson, packageContents)

  // Format with prettier and sort before writing.
  writeFileSync(packageJsonPath, formatJson(JSON.stringify(mergedPackageJson)))

  if (!mergedPackageJson.papua) {
    mergedPackageJson.papua = {}
  }

  return { packageContents: mergedPackageJson }
}

export const writeConfiguration = async (postinstall = false) => {
  const workspaces = await getWorkspacePaths()

  await Promise.all(
    workspaces.map(async (workspacePath) => {
      const { packageContents } = await writePackageJson(postinstall, workspacePath)
      // Skip modifying the project in case it's being installed for later programmatic use by a plugin.
      if (postinstall && isPlugin(packageContents)) {
        return null
      }
      // writeJSConfig(packageContents.papua.jsconfig)
      writeTSConfig(packageContents.papua.tsconfig)
      // writeGitIgnore(packageContents.papua.gitignore)
      // return { packageContents }
      return null
    })
  )
}
