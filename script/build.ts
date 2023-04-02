import { rspack, MultiCompiler } from '@rspack/core'
import { loadRspackConfig } from '../utility/configuration'
import { logStats, logError } from '../utility/stats'

// DOC https://github.com/web-infra-dev/rspack/blob/main/packages/rspack-cli/src/rspack-cli.ts
export default async (development: boolean) => {
  const [configuration] = await loadRspackConfig(development)
  return new Promise<MultiCompiler>((done) => {
    const compiler = rspack(configuration, () => done(compiler))
  })
}
// const [configuration] = await loadWebpackConfig(false)

// let compiler
// try {
//   compiler = webpack(configuration)
// } catch (error) {
//   logError(error)
//   process.exit(1)
// }

// const handler = (done, error, stats) => {
//   if (error) {
//     logError(error)
//   } else if (stats.stats && Array.isArray(stats.stats)) {
//     stats.stats.forEach((stat) => logStats(stat, false))
//   } else {
//     logStats(stats, false)
//   }
//   done()
// }

// return new Promise((done) => {
//   compiler.run(handler.bind(null, done))
// })
