import { rspack } from '@rspack/core'
import { loadRspackConfig } from '../utility/configuration'
import { log } from '../utility/helper'
import { logStats, logError, recompiling } from '../utility/stats'

export default async (development = true) => {
  const configuration = await loadRspackConfig(development)

  const compiler = rspack(configuration)

  // Indicates new compile has been triggered on watched changes.
  compiler.hooks.invalid.tap('invalid', recompiling)

  compiler.watch({}, (error, stats) => {
    if (error) {
      logError(error)
      log('Compilation failed during watch', 'error')
    }

    logStats(stats, development)
  })

  return {
    // eslint-disable-next-line no-promise-executor-return
    close: () => new Promise((done) => compiler.close(done)),
    compiler,
  }
}
