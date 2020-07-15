import webpack from 'webpack'
import webpackConfig from './../configuration/webpack.js'

export default (development) => {
  const config = webpackConfig(development)
  // TODO merge with local project configuration.
  const compiler = webpack(config)

  const handler = (error, stats) => {
    if (error) {
      console.error(error.message)
    } else {
      // console.log(stats)
      if (!development) {
        process.exit(0)
      }
    }
  }

  // https://webpack.js.org/api/node/
  if (development) {
    compiler.watch({}, handler)
  } else {
    compiler.run(handler)
  }
}
