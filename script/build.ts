import { rspack } from '@rspack/core'
import HtmlRspackPlugin from '@rspack/plugin-html'
// import { loadWebpackConfig } from '../utility/configuration'
import { logStats, logError } from '../utility/stats'

// DOC https://github.com/web-infra-dev/rspack/blob/main/packages/rspack-cli/src/rspack-cli.ts
export default async () =>
  new Promise<void>((done) => {
    const compiler = rspack(
      {
        entry: {
          main: './index.js',
        },
        output: {
          filename: 'main.js',
        },
        devtool: 'source-map', // 'cheap-module-source-map' for development
        plugins: [new HtmlRspackPlugin()],
      },
      () => done()
    )
  })
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
