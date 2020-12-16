import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import getPort from 'get-port'
import { loadWebpackConfig } from '../utility/configuration.js'
import {
  startServer,
  recompiling,
  logStats,
  logError,
} from '../utility/stats.js'

export default async (development) => {
  const [configuration, devServerConfiguration] = await loadWebpackConfig(
    development
  )

  let compiler
  try {
    compiler = webpack(configuration)
  } catch (error) {
    logError(error)
    process.exit(1)
  }

  const handler = (error, stats) => {
    if (error) {
      logError(error)
    } else {
      logStats(stats, development)
    }
  }

  if (!development) {
    // Run just webpack.
    compiler.run(handler)
    return
  }

  // Run webpack with webpack-dev-server.
  compiler.hooks.invalid.tap('invalid', recompiling)

  compiler.hooks.done.tap('done', (stats) => logStats(stats, development))

  const server = new WebpackDevServer(compiler, devServerConfiguration)
  server.listen(
    await getPort({ port: getPort.makeRange(3000, 3100), host: '127.0.0.1' }),
    'localhost',
    (error) => {
      if (error) {
        console.log(error)
        return
      }

      startServer()
    }
  )

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
