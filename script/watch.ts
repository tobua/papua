import { rspack } from '@rspack/core'
import { loadRspackConfig } from '../utility/configuration'
import { log } from '../utility/helper'
import { logStats, logError } from '../utility/stats'

// DOC https://github.com/web-infra-dev/rspack/blob/main/packages/rspack-cli/src/rspack-cli.ts
export default async (development = true) => {
  const [configuration] = await loadRspackConfig(development)

  const compiler = rspack(configuration)

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
