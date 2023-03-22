import webpack from 'webpack'
import { loadWebpackConfig } from '../utility/configuration'
import { logStats, logError } from '../utility/stats'

export default async () => {
  const [configuration] = await loadWebpackConfig(false)

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
    } else if (stats.stats && Array.isArray(stats.stats)) {
      stats.stats.forEach((stat) => logStats(stat, false))
    } else {
      logStats(stats, false)
    }
    done()
  }

  return new Promise((done) => {
    compiler.run(handler.bind(null, done))
  })
}
