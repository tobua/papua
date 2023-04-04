import { rspack } from '@rspack/core'
import { RspackDevServer, Configuration } from '@rspack/dev-server'
import merge from 'deepmerge'
import { startServer, recompiling, logStats, logError } from '../utility/stats'
import { freePort, log } from '../utility/helper'
import { getInputs } from '../utility/input'
import { loadRspackConfig } from '../utility/configuration'
import { devServer } from '../configuration/rspack-server'

export default async (options: Configuration = {}, inputs = {}) => {
  const { port = await freePort(), headless } = getInputs(inputs, {
    port: 'number',
    headless: 'boolean',
  })

  const [configuration] = await loadRspackConfig(true)

  // Webpack-Dev-Server logs hidden through webpack logger.
  configuration.infrastructureLogging = {
    level: 'warn',
  }

  const compiler = rspack(configuration)

  const devServerConfiguration: Configuration = merge(devServer(port, headless), options, {
    clone: false,
  })

  // Run webpack with webpack-dev-server.
  compiler.hooks.invalid.tap('invalid', recompiling)

  compiler.hooks.done.tap('done', (stats) => {
    logStats(stats, true)
  })

  let server: RspackDevServer

  try {
    server = new RspackDevServer(devServerConfiguration, compiler)
  } catch (error) {
    log('Failed to create dev server', 'error')
  }

  const url = `${devServerConfiguration.host}:${devServerConfiguration.port}`

  startServer(url)

  // TODO enabled by default, still necessary? attachDoneSignals(server)

  try {
    await server.start()
  } catch (error) {
    log('Failed to start server', 'error')
  }

  return {
    server,
    url,
    port: devServerConfiguration.port,
    stop: () => server.stop(), // Requires context.
  }
}
