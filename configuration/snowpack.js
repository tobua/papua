import { freePort } from '../utility/helper.js'
import { options } from '../utility/options.js'

export default async () => ({
  devOptions: {
    port: await freePort(),
    open: true,
  },
  buildOptions: {
    out: options().output,
    baseUrl: options().publicPath,
    sourceMaps: true,
  },
})
