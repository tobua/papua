import { rspack, MultiCompiler } from '@rspack/core'
import { loadRspackConfig } from '../utility/configuration'
import { logStats, logError } from '../utility/stats'

// DOC https://github.com/web-infra-dev/rspack/blob/main/packages/rspack-cli/src/rspack-cli.ts
export default async (development: boolean) => {
  const configuration = await loadRspackConfig(development)
  return new Promise<MultiCompiler>((done) => {
    const compiler = rspack(configuration, (error, stats) => {
      if (error) {
        logError(error)
        process.exit(1)
      }

      logStats(stats, development, compiler)

      done(compiler)
    })
  })
}
