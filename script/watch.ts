import webpack from 'webpack'
import { loadWebpackConfig } from '../utility/configuration'
import { logStats, logError, recompiling } from '../utility/stats'

export default async () => {
  const [configuration] = await loadWebpackConfig(true)

  let compiler
  try {
    compiler = webpack(configuration)
  } catch (error) {
    logError(error)
    process.exit(1)
  }

  compiler.hooks.invalid.tap('invalid', recompiling)

  return compiler.watch({}, (error, stats) => {
    if (error) {
      logError(error)
    } else if (stats.stats && Array.isArray(stats.stats)) {
      stats.stats.forEach((stat) => logStats(stat, true))
    } else {
      logStats(stats, true)
    }
  })
}
