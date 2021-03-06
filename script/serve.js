import { join } from 'path'
import http from 'http'
import open from 'open'
import rimraf from 'rimraf'
import { moveSync } from 'fs-extra'
import handler from 'serve-handler'
import merge from 'deepmerge'
import { log, freePort } from '../utility/helper.js'
import { options } from '../utility/options.js'
import build from './build.js'

export default async () => {
  const additionalArguments = process.argv.slice(3)
  const publicPath = options().publicPath ? `/${options().publicPath}` : ''

  log('Building...')
  await build(false)

  // Wrap dist files in public path folder.
  if (publicPath) {
    moveSync(
      options().output,
      join('.temp', options().output, options().publicPath)
    )
    moveSync(join('.temp', options().output), join(options().output))
    rimraf.sync('.temp')
  }

  let configuration = {
    public: options().output,
    // Rewrites for SPA
    rewrites: [{ source: '/**', destination: '/index.html' }],
  }

  if (publicPath) {
    configuration.redirects = [{ source: '/', destination: publicPath }]
    configuration.rewrites = [
      {
        source: `${publicPath}/**`,
        destination: `${publicPath}/index.html`,
      },
    ]
  }

  if (typeof options().serve === 'object') {
    configuration = merge(configuration, options().serve)
  }

  const server = http.createServer((request, response) =>
    handler(request, response, configuration)
  )

  const port = await freePort()

  server.listen(port, () => {
    log(`Serving /${configuration.public} from localhost:${port}${publicPath}`)

    if (additionalArguments.includes('--open')) {
      open(`http://localhost:${port}${publicPath}`)
    }
  })
}
