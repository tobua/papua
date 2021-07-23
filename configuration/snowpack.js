import { freePort } from '../utility/helper.js'
import { options } from '../utility/options.js'

export default async () => ({
  devOptions: {
    port: await freePort(),
    open: 'default',
  },
  buildOptions: {
    out: options().output,
    baseUrl: options().publicPath,
    sourceMaps: true,
    jsxInject: options().react ? `import React from 'react'` : undefined,
  },
})
