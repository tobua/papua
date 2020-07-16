import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import webpackConfig from './../configuration/webpack.js'
import webpackServerConfig from './../configuration/webpack-server.js'

const HOST = process.env.HOST || '0.0.0.0'

export default (development) => {
  const config = webpackConfig(development)
  // TODO merge with local project configuration.
  const compiler = webpack(config)

  const handler = (error, stats) => {
    if (error) {
      console.error(error.message)
    } else {
      // console.log(stats)
      console.log('success print stats: ')
    }

    if (!development) {
      process.exit()
    }
  }

  // https://webpack.js.org/api/node/
  if (development) {
    const server = new WebpackDevServer(compiler, webpackServerConfig)
    server.listen(3000, HOST, (error) => {
      if (error) {
        return console.log(error)
      }

      console.log('Starting papua...\n')
    })

    const doneSignals = ['SIGINT', 'SIGTERM']

    doneSignals.forEach(function (sig) {
      process.on(sig, function () {
        server.close()
        process.exit()
      })
    })

    process.stdin.on('end', function () {
      server.close()
      process.exit()
    })
  } else {
    compiler.run(handler)
  }
}
