import { RspackOptions, rspack } from '@rspack/core'
import { RspackDevServer, Configuration } from '@rspack/dev-server'
import { deepmerge } from 'deepmerge-ts'
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

  // dev-server logs hidden through logger.
  configuration[0].infrastructureLogging = {
    level: 'warn',
  }

  const compiler = rspack(configuration)

  const devServerConfigurations = configuration.reduce(
    (result, current) => deepmerge(result, current.devServer ?? ({} as RspackOptions)),
    {}
  )

  const devServerConfiguration: Configuration = deepmerge(
    devServer(port, headless),
    devServerConfigurations,
    options
  )

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
