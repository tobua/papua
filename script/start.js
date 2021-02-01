import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import { loadWebpackConfig } from '../utility/configuration.js'
import {
  startServer,
  recompiling,
  logStats,
  logError,
} from '../utility/stats.js'
import { freePort } from '../utility/helper.js'

export default async (development) => {
  const [configuration, devServerConfiguration] = await loadWebpackConfig(true)

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
      stats.stats.forEach((stat) => logStats(stat, development))
    } else {
      logStats(stats, development)
    }
  })

  const server = new WebpackDevServer(compiler, devServerConfiguration)
  const port = devServerConfiguration.port || (await freePort())
  const host = devServerConfiguration.host || 'localhost'
  server.listen(port, host, (error) => {
    if (error) {
      console.log(error)
      return
    }

    startServer(`${host}:${port}`)
  })

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

  return null
}
