import { rspack } from '@rspack/core'
import { RspackDevServer, Configuration } from '@rspack/dev-server'
import merge from 'deepmerge'
import { startServer, recompiling, logStats } from '../utility/stats'
import { freePort, log } from '../utility/helper'
import { getCliInputs } from '../utility/input'
import { loadRspackConfig } from '../utility/configuration'
import { devServer } from '../configuration/rspack-server'

export default async (options: Configuration = {}, inputs = {}) => {
  const { port = await freePort(), headless } = getCliInputs<{ port: number; headless: boolean }>(
    {
      port: 'number',
      headless: 'boolean',
    },
    inputs
  )

  const configuration = await loadRspackConfig(true)

  // Webpack-Dev-Server logs hidden through webpack logger.
  configuration[0].infrastructureLogging = {
    level: 'warn',
  }

  if (configuration.length > 1) {
    log(
      `dev-server currently doesn't support multiple configurations (array). Only first will be used`,
      'warning'
    )
  }

  // TODO multiple configurations currently not working, but already fixed on GitHub just not released.
  // packages/rspack-dev-server/src/server.ts
  const compiler = rspack(configuration[0])

  const devServerConfigurations = configuration.reduce(
    (result, current) => merge(result, current.devServer ?? {}, { clone: true }),
    {}
  )

  const devServerConfiguration: Configuration = merge(
    merge(devServer(port, headless), devServerConfigurations, { clone: false }),
    options,
    {
      clone: false,
    }
  )

  // Run webpack with webpack-dev-server.
  compiler.hooks.invalid.tap('invalid', recompiling)

  compiler.hooks.done.tap('done', (stats) => {
    logStats(stats, true, compiler)
  })

  let server: RspackDevServer

  try {
    server = new RspackDevServer(devServerConfiguration, compiler)
  } catch (error) {
    log('Failed to create dev server', 'error')
  }

  const url = `${devServerConfiguration.host}:${devServerConfiguration.port}`

  startServer(url)

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
