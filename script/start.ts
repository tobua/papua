import { RspackDevServer, Configuration } from '@rspack/dev-server'
// import { startServer, recompiling, logStats, logError } from '../utility/stats'
import { freePort, log } from '../utility/helper'
import { getInputs } from '../utility/input'
import watch from './watch'

export default async (options: Configuration, inputs = {}) => {
  const { port = await freePort(), headless } = getInputs(inputs, {
    port: 'number',
    headless: 'boolean',
  })

  const { compiler } = await watch(true)

  const devServerConfiguration = {
    port,
    open: !headless && process.env.NODE_ENV !== 'test',
    host: 'localhost',
    ...options,
  } satisfies Configuration

  let server: RspackDevServer

  try {
    server = new RspackDevServer(devServerConfiguration, compiler)
  } catch (error) {
    log('Failed to create dev server', 'error')
  }

  try {
    await server.start()
  } catch (error) {
    log('Failed to start server', 'error')
  }

  return {
    server,
    url: `${devServerConfiguration.host}:${devServerConfiguration.port}`,
    port: devServerConfiguration.port,
    stop: () => server.stop(), // Requires context.
  }

  // const [configuration, devServerConfiguration] = await loadWebpackConfig(true)

  // if (typeof options === 'object') {
  //   // objectAssignDeep(devServerConfiguration, options)
  // }

  // // Webpack-Dev-Server logs hidden through webpack logger.
  // configuration.infrastructureLogging = {
  //   level: 'warn',
  // }

  // let compiler
  // try {
  //   compiler = webpack(configuration)
  // } catch (error) {
  //   logError(error)
  //   process.exit(1)
  // }

  // // Run webpack with webpack-dev-server.
  // compiler.hooks.invalid.tap('invalid', recompiling)

  // compiler.hooks.done.tap('done', (stats) => {
  //   if (stats.stats && Array.isArray(stats.stats)) {
  //     stats.stats.forEach((stat) => logStats(stat, true))
  //   } else {
  //     logStats(stats, true)
  //   }
  // })

  // if (!devServerConfiguration.port) {
  //   devServerConfiguration.port = port
  // }

  // if (!devServerConfiguration.host) {
  //   devServerConfiguration.host = 'localhost'
  // }

  // if (headless) {
  //   devServerConfiguration.open = false
  // }

  // const server = new WebpackDevServer(devServerConfiguration, compiler)
  // const url = `${devServerConfiguration.host}:${devServerConfiguration.port}`

  // attachDoneSignals(server)

  // try {
  //   await server.start()
  // } catch (error) {
  //   console.error(error)
  //   return {}
  // }

  // startServer(url)

  // return {
  //   url,
  //   port: devServerConfiguration.port,
  //   server,
  // }
}
