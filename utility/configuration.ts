import {
  accessSync,
  existsSync,
  constants,
  readFileSync,
  writeFileSync,
  unlinkSync,
  symlinkSync,
} from 'fs'
import { join, normalize } from 'path'
import { formatPackageJson } from 'pakag'
import { deepmerge } from 'deepmerge-ts'
import { MultiRspackOptions, RspackOptions } from '@rspack/core'
import parse from 'parse-gitignore'
import pEachSeries from 'p-each-series'
import { tsconfig } from '../configuration/tsconfig.js'
import { jsconfig } from '../configuration/jsconfig.js'
import { packageJson } from '../configuration/package'
import { gitignore } from '../configuration/gitignore'
import rspackConfig from '../configuration/rspack'
import {
  log,
  isPlugin,
  getConfigurationFilePath,
  deepForEach,
  hasLocalDependencies,
  refresh,
} from './helper'
import { options } from './options'
import {
  getPluginBasePath,
  getProjectBasePath,
  getWorkspacePaths,
  isWorkspace,
  setWorkspacePath,
} from './path'
import { Dependencies, HtmlOptions } from '../types'
import { isTest } from './test'

type UserConfiguration = RspackOptions & { after?: Function; html?: boolean | HtmlOptions }

const createSingleRspackConfiguration = (
  baseConfiguration: RspackOptions,
  userConfiguration: UserConfiguration,
  afterMergeConfiguration: Function,
  index = 0
) => {
  // Quick copy of builtins, as baseConfiguration is generated only once.
  let configuration: RspackOptions = {
    ...baseConfiguration,
    builtins: {
      ...{
        html: [...baseConfiguration.builtins.html],
        copy: { ...baseConfiguration.builtins.copy },
        define: { ...baseConfiguration.builtins.define },
        presetEnv: { ...baseConfiguration.builtins.presetEnv },
      },
    },
  }

  if (userConfiguration.builtins?.html || index !== 0) {
    delete configuration.builtins.html
  }

  if (userConfiguration.builtins?.copy) {
    delete configuration.builtins.copy
  }

  if (userConfiguration.builtins?.define) {
    delete configuration.builtins.define
  }

  if (userConfiguration.builtins?.presetEnv) {
    delete configuration.builtins.presetEnv
  }

  // With clone plugins etc. (non-serializable properties) will be gone.
  configuration = deepmerge(configuration, userConfiguration)

  // Apply user edits.
  if (afterMergeConfiguration) {
    const resultingConfiguration = afterMergeConfiguration(configuration)
    // If no return value assume in place edits without return.
    if (typeof resultingConfiguration === 'object') {
      configuration = resultingConfiguration
    }
  }

  return configuration as unknown as RspackOptions
}

const createMultipleWebpackConfigurations = (
  baseConfiguration: RspackOptions,
  userConfigurations: UserConfiguration[],
  afterMergeConfiguration: Function
) => {
  const configurations = userConfigurations.map((userConfiguration, index) =>
    createSingleRspackConfiguration(
      baseConfiguration,
      userConfiguration,
      afterMergeConfiguration,
      index
    )
  )

  return configurations
}

export const loadRspackConfig = async (development: boolean) => {
  let userConfiguration: UserConfiguration & { default?: any } = {}
  let afterMergeConfiguration
  const userConfigurationPath = join(getProjectBasePath(), 'rspack.config.js')

  try {
    // Works with module.exports = {} and export default {}.
    // The latter only if type in project is set to ES Modules.
    userConfiguration = await import(userConfigurationPath)

    if (userConfiguration.after && typeof userConfiguration.after === 'function') {
      afterMergeConfiguration = userConfiguration.after
    }

    if (userConfiguration.default) {
      userConfiguration = userConfiguration.default
    }
  } catch (error) {
    if (existsSync(userConfigurationPath)) {
      log(`Failed to import user rspack configuration in ${userConfigurationPath}`, 'warning')
      console.error(error)
    }

    // Ignore, no user configuration found.
  }

  const baseConfiguration = rspackConfig(development)

  // User configuration can be a function and will receive the default config and the environment.
  if (typeof userConfiguration === 'function') {
    // @ts-ignore
    userConfiguration = userConfiguration(baseConfiguration, development)
  }

  let configuration: MultiRspackOptions

  if (!Array.isArray(userConfiguration)) {
    configuration = [
      createSingleRspackConfiguration(
        baseConfiguration,
        userConfiguration,
        afterMergeConfiguration
      ),
    ]
  } else {
    configuration = createMultipleWebpackConfigurations(
      baseConfiguration,
      userConfiguration,
      afterMergeConfiguration
    )
  }

  return configuration
}

const writeUserAndPackageConfig = async (
  filename: string,
  userConfig: object,
  packageConfig: object,
  userTSConfigPath: string,
  packageTSConfigPath: string
) => {
  try {
    writeFileSync(
      packageTSConfigPath,
      await formatPackageJson(JSON.stringify(packageConfig), { sort: false })
    )
    writeFileSync(
      userTSConfigPath,
      await formatPackageJson(JSON.stringify(userConfig), { sort: false })
    )
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
      subject[key] = normalize(value.replace(baseFromPackagePath, ''))
    }
    if (typeof value === 'string' && value.includes(emptyBasePackagePath)) {
      // eslint-disable-next-line no-param-reassign
      subject[key] = normalize(value.replace(emptyBasePackagePath, '.'))
    }
  })
}

const writeOnlyUserConfig = async (
  filename: string,
  userConfig: any,
  packageConfig: object,
  userTSConfigPath: string
) => {
  try {
    // eslint-disable-next-line no-param-reassign
    delete userConfig.extends
    adaptConfigToRoot(packageConfig)
    const mergedUserConfig = deepmerge(packageConfig, userConfig)
    writeFileSync(
      userTSConfigPath,
      await formatPackageJson(JSON.stringify(mergedUserConfig), { sort: false })
    )
  } catch (_) {
    log(`Couldn't write ${filename}, therefore this plugin might not work as expected`, 'warning')
  }
}

const writePackageAndUserFile = async (
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
    if (isWorkspace() || (isTest() && !packageTSConfigPath.includes('node_modules'))) {
      // Write config for each project, as sharing isn't possible.
      throw new Error()
    }

    // If package tsconfig can be written, adapt it and only extend user config.
    accessSync(
      packageTSConfigPath,
      // eslint-disable-next-line no-bitwise
      constants.F_OK | constants.R_OK | constants.W_OK
    )
    await writeUserAndPackageConfig(
      filename,
      userConfig,
      packageConfig,
      userTSConfigPath,
      packageTSConfigPath
    )
  } catch (_) {
    // Package config cannot be written, write full contents to user file.
    await writeOnlyUserConfig(filename, userConfig, packageConfig, userTSConfigPath)
  }
}

export const writeTSConfig = (tsConfigUserOverrides = {}) =>
  writePackageAndUserFile(!options().typescript, 'tsconfig.json', tsconfig, tsConfigUserOverrides)

export const writeJSConfig = (jsConfigUserOverrides = {}) =>
  writePackageAndUserFile(options().typescript, 'jsconfig.json', jsconfig, jsConfigUserOverrides)

export const writeGitIgnore = (gitIgnoreUserOverrides: string[] = []) => {
  const gitIgnorePath = join(getProjectBasePath(), '.gitignore')
  let entries = []

  if (existsSync(gitIgnorePath)) {
    const existingGitignoreLines = parse(readFileSync(gitIgnorePath, 'utf8')).patterns
    entries = entries.concat(existingGitignoreLines)
  }

  entries = entries.concat(gitignore(gitIgnoreUserOverrides))

  // Remove duplicates, add empty line at the end
  entries = [...new Set(entries), '']

  writeFileSync(gitIgnorePath, entries.join('\r\n'))
}

export const writePrettierIgnore = (prettierIgnoreUserOverrides: string[] = []) => {
  const prettierIgnorePath = join(getPluginBasePath(), 'configuration/.prettierignore')
  let entries = []

  entries = entries.concat([options().output]).concat(prettierIgnoreUserOverrides)

  // Remove duplicates, add empty line at the end
  entries = [...new Set(entries), '']

  writeFileSync(prettierIgnorePath, entries.join('\r\n'))
}

export const removePropertiesToUpdate = (pkg) => {
  if (typeof pkg.engines === 'object') {
    delete pkg.engines.node
  }
}

const installLocalDependencies = (dependencies: Dependencies) => {
  if (!hasLocalDependencies(dependencies)) {
    return
  }

  Object.entries(dependencies).forEach(([name, folder]) => {
    const absolutePath = join(getProjectBasePath(), folder)
    const targetPath = join(getProjectBasePath(), 'node_modules', name)
    if (existsSync(absolutePath) && !existsSync(targetPath)) {
      try {
        symlinkSync(absolutePath, targetPath)
      } catch (error) {
        // Symlinks only allowed for administrators on Windows.
        log(`Failed to create symlink for localDependency ${name}`, 'warning')
      }
    } else if (!existsSync(absolutePath)) {
      log(
        `localDependency "${name}" pointing to a non-existing location: ${absolutePath}`,
        'warning'
      )
    }
  })
}

export const writePackageJson = async (postinstall: boolean) => {
  const packageJsonPath = join(getProjectBasePath(), './package.json')

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
  const mergedPackageJson = deepmerge(generatedPackageJson, packageContents)

  // Format with prettier and sort before writing.
  writeFileSync(packageJsonPath, await formatPackageJson(JSON.stringify(mergedPackageJson)))

  if (!mergedPackageJson.papua) {
    mergedPackageJson.papua = {}
  }

  return { packageContents: mergedPackageJson }
}

export async function writeConfiguration(postinstall = false) {
  const workspaces = await getWorkspacePaths()

  const setupWorkspace = async (workspacePath) => {
    setWorkspacePath(workspacePath)
    // Clear options cache and load options for current workspace.
    refresh()
    // eslint-disable-next-line no-await-in-loop
    const { packageContents } = await writePackageJson(postinstall)
    // Skip modifying the project in case it's being installed for later programmatic use by a plugin.
    if (postinstall && isPlugin(packageContents)) {
      return
    }
    await writeJSConfig(packageContents.papua.jsconfig)
    await writeTSConfig(packageContents.papua.tsconfig)
    writeGitIgnore(packageContents.papua.gitignore)
    writePrettierIgnore(packageContents.papua.prettierIgnore)
    installLocalDependencies(packageContents.localDependencies)
    setWorkspacePath('.')
  }

  await pEachSeries(workspaces, setupWorkspace)
}
