import { resolve } from 'path'
import merge from 'deepmerge'
import webpackConfig from '../configuration/webpack.js'
import webpackServerConfiguration from '../configuration/webpack-server.js'

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
    console.log('is func')
    userConfiguration = userConfiguration(configuration, development)
  }

  // Without clone plugins etc. will be gone.
  configuration = merge(configuration, userConfiguration, { clone: false })

  const devServerConfiguration = configuration.devServer
  delete configuration.devServer

  return [configuration, devServerConfiguration]
}
