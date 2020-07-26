import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import webpackConfig from '../configuration/webpack.js'
import webpackServerConfig from '../configuration/webpack-server.js'
import {
  startServer,
  recompiling,
  logStats,
  logError,
} from '../utility/stats.js'

export default (development) => {
  const config = webpackConfig(development)
  // TODO merge with local project configuration.
  let compiler
  try {
    compiler = webpack(config)
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

  // https://webpack.js.org/api/node/
  if (development) {
    compiler.hooks.invalid.tap('invalid', recompiling)

    compiler.hooks.done.tap('done', (stats) => logStats(stats, development))

    const server = new WebpackDevServer(compiler, webpackServerConfig)
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
  } else {
    compiler.run(handler)
  }
}
