import handler from 'serve-handler'
import http from 'http'
import open from 'open'
import merge from 'deepmerge'
import { log, freePort } from '../utility/helper.js'
import { options } from '../utility/options.js'
import build from './build.js'

export default async () => {
  const additionalArguments = process.argv.slice(3)
  const publicPath = options().publicPath ? `/${options().publicPath}` : ''

  log('Building...')
  await build(false)

  let configuration = {
    public: options().output,
  }

  if (publicPath) {
    configuration.redirects = [{ source: '/', destination: publicPath }]
    configuration.rewrites = [
      { source: `${publicPath}`, destination: '/index.html' },
      { source: `${publicPath}/**/*`, destination: '/index.html' },
      {
        source: `${publicPath}/:path/:name.:extension`,
        destination: '/:path/:name.:extension',
      },
    ]
  }

  configuration = merge(configuration, options().serve)

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
