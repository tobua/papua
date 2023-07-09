import { cpSync, existsSync, rmSync, mkdirSync } from 'fs'
import { join } from 'path'
import http from 'http'
import openBrowser from 'open'
import handler from 'serve-handler'
import { deepmerge } from 'deepmerge-ts'
import { log, freePort, cleanOuput } from '../utility/helper'
import { options } from '../utility/options'
import runBuild from './build'
import runWatch from './watch'
import { getProjectBasePath } from '../utility/path'
import { getCliInputs } from '../utility/input'
import { ServeConfig } from '../types'

const addLeadingSlash = (path: string) => {
  if (path.startsWith('/')) {
    return path
  }

  return `/${path}`
}

type Inputs = {
  port: number
  open: boolean
  watch: boolean
}

export default async (inputs: Partial<Inputs> = {}) => {
  const {
    port = await freePort(),
    open,
    watch = false,
  } = getCliInputs<Inputs>(
    {
      port: 'number',
      open: 'boolean',
      watch: 'boolean',
    },
    inputs
  )
  const publicPath = options().publicPath ? addLeadingSlash(options().publicPath) : ''
  const hasPublicPath = publicPath && publicPath !== '/'
  let closeWatcher: () => Promise<any>

  log('Building...')
  const outputPath = join(getProjectBasePath(), options().output)
  cleanOuput(options().output)

  if (!watch) {
    await runBuild(false)
  } else {
    closeWatcher = (await runWatch(true)).close
  }

  // Wrap dist files in public path folder.
  if (hasPublicPath && existsSync(outputPath)) {
    const tempPath = join(getProjectBasePath(), '.temp')
    mkdirSync(tempPath, { recursive: true })
    cpSync(outputPath, tempPath, {
      recursive: true,
    })
    rmSync(outputPath, { recursive: true, force: true })
    const publicPathWrapperPath = join(getProjectBasePath(), options().output, options().publicPath)
    mkdirSync(publicPathWrapperPath, { recursive: true })
    cpSync(tempPath, publicPathWrapperPath, {
      recursive: true,
    })
    rmSync(tempPath, { recursive: true, force: true })
  }

  let configuration: ServeConfig = {
    public: options().output,
    // Rewrites for SPA
    rewrites: [{ source: '/**', destination: '/index.html' }],
  }

  if (hasPublicPath) {
    configuration.redirects = [{ source: '/', destination: publicPath, type: 301 }]
    configuration.rewrites = [
      {
        source: `${publicPath}/**`,
        destination: `${publicPath}/index.html`,
      },
    ]
  }

  if (typeof options().serve === 'object') {
    configuration = deepmerge(configuration, options().serve)
  }

  const server = http.createServer((request, response) => handler(request, response, configuration))
  const url = `http://localhost:${port}${publicPath}`

  return new Promise<{ close: Function; port: number; url: string }>((done) => {
    server.listen(port, () => {
      log(`Serving /${configuration.public} from ${url}`)

      if (open) {
        openBrowser(url)
      }

      done({
        close: async () => {
          server.close()
          if (closeWatcher) {
            await closeWatcher()
          }
        },
        port,
        url,
      })
    })
  })
}
