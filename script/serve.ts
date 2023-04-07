import { join } from 'path'
import http from 'http'
import openBrowser from 'open'
import rimraf from 'rimraf'
import fsExtra from 'fs-extra'
import handler from 'serve-handler'
import merge from 'deepmerge'
import { log, freePort } from '../utility/helper'
import { options } from '../utility/options'
import build from './build'
import { getProjectBasePath } from '../utility/path'
import { getCliInputs } from '../utility/input'

const addLeadingSlash = (path: string) => {
  if (path.startsWith('/')) {
    return path
  }

  return `/${path}`
}

export default async (inputs = {}) => {
  const { port = await freePort(), open } = getCliInputs<{ port: number; open: boolean }>(
    {
      port: 'number',
      open: 'boolean',
    },
    inputs
  )
  const publicPath = options().publicPath ? addLeadingSlash(options().publicPath) : ''

  log('Building...')
  rimraf.sync(join(getProjectBasePath(), options().output))
  await build(false)

  // Wrap dist files in public path folder.
  if (publicPath) {
    fsExtra.moveSync(options().output, join('.temp', options().output, options().publicPath))
    fsExtra.moveSync(join('.temp', options().output), join(options().output))
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

  const server = http.createServer((request, response) => handler(request, response, configuration))

  server.listen(port, () => {
    log(`Serving /${configuration.public} from localhost:${port}${publicPath}`)

    if (open) {
      openBrowser(`http://localhost:${port}${publicPath}`)
    }
  })
}
