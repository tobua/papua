import rspack from '@rspack/core'
import { loadRspackConfig } from '../utility/configuration'
import { log, cleanOuput } from '../utility/helper'
import { logStats, logError, recompiling } from '../utility/stats'
import { options } from '../utility/options'

export default async (development = true) => {
  cleanOuput(options().output)

  const configuration = await loadRspackConfig(development)

  const compiler = rspack.rspack(configuration)

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
    close: () =>
      new Promise((done) => {
        compiler.close(done)
      }),
    compiler,
  }
}
