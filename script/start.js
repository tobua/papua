import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import objectAssignDeep from 'object-assign-deep'
import { loadWebpackConfig } from '../utility/configuration.js'
import { startServer, recompiling, logStats, logError } from '../utility/stats.js'
import { freePort } from '../utility/helper.js'

const attachDoneSignals = (server) => {
  const doneSignals = ['SIGINT', 'SIGTERM']

  doneSignals.forEach((signal) =>
    process.on(signal, () => {
      server.close()
      process.exit(0)
    })
  )

  process.stdin.on('end', () => {
    server.close()
    process.exit(0)
  })
}

export default async (options) => {
  const [configuration, devServerConfiguration] = await loadWebpackConfig(true)

  if (typeof options === 'object') {
    objectAssignDeep(devServerConfiguration, options)
  }

  // Webpack-Dev-Server logs hidden through webpack logger.
  configuration.infrastructureLogging = {
    level: 'warn',
  }

  let compiler
  try {
    compiler = webpack(configuration)
  } catch (error) {
    logError(error)
    process.exit(1)
  }

  // Run webpack with webpack-dev-server.
  compiler.hooks.invalid.tap('invalid', recompiling)

  compiler.hooks.done.tap('done', (stats) => {
    if (stats.stats && Array.isArray(stats.stats)) {
      stats.stats.forEach((stat) => logStats(stat, true))
    } else {
      logStats(stats, true)
    }
  })

  if (!devServerConfiguration.port) {
    devServerConfiguration.port = await freePort()
  }

  if (!devServerConfiguration.host) {
    devServerConfiguration.host = 'localhost'
  }

  const server = new WebpackDevServer(devServerConfiguration, compiler)
  const url = `${devServerConfiguration.host}:${devServerConfiguration.port}`

  attachDoneSignals(server)

  try {
    await server.start()
  } catch (error) {
    console.error(error)
    return {}
  }

  startServer(url)

  return {
    url,
    port: devServerConfiguration.port,
    server,
  }
}
