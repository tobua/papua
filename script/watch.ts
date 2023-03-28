import { rspack } from '@rspack/core'
import { loadRspackConfig } from '../utility/configuration'
import { log } from '../utility/helper'
import { logStats, logError } from '../utility/stats'

// DOC https://github.com/web-infra-dev/rspack/blob/main/packages/rspack-cli/src/rspack-cli.ts
export default async (development: boolean) => {
  const [configuration] = await loadRspackConfig(development)

  const compiler = rspack(configuration, (buildError, buildStats) => {
    if (buildError) {
      log('Build error', 'error')
    }

    compiler.watch({}, (error, stats) => {
      if (error) {
        log('Watch error', 'error')
      }

      // console.log('watch', stats)
    })
  })

  // eslint-disable-next-line no-promise-executor-return
  return () => new Promise((done) => compiler.close(done))
}
