import webpack from 'webpack'
import { loadWebpackConfig } from '../utility/configuration.js'
import { logStats, logError } from '../utility/stats.js'

export default async (watch = false) => {
  const [configuration] = await loadWebpackConfig(false, watch)

  let compiler
  try {
    compiler = webpack(configuration)
  } catch (error) {
    logError(error)
    process.exit(1)
  }

  const handler = (done, error, stats) => {
    if (error) {
      logError(error)
    } else {
      logStats(stats, false)
    }
    done()
  }

  return new Promise((done) => compiler.run(handler.bind(null, done)))
}
