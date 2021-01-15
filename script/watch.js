import webpack from 'webpack'
import { loadWebpackConfig } from '../utility/configuration.js'
import { logStats, logError, recompiling } from '../utility/stats.js'

export default async () => {
  const [configuration] = await loadWebpackConfig(false)

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
    } else {
      logStats(stats, false)
    }
  })
}
