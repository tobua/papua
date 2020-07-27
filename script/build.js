import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
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
    return compiler.run(handler)
  }

  // Run webpack with webpack-dev-server.
  compiler.hooks.invalid.tap('invalid', recompiling)

  compiler.hooks.done.tap('done', (stats) => logStats(stats, development))

  const server = new WebpackDevServer(compiler, devServerConfiguration)
  server.listen(3000, 'localhost', (error) => {
    if (error) {
      return console.log(error)
    }

    startServer()
  })

  const doneSignals = ['SIGINT', 'SIGTERM']

  doneSignals.forEach((signal) =>
    process.on(signal, () => server.close() && process.exit())
  )
  process.stdin.on('end', () => server.close() && process.exit())
}
