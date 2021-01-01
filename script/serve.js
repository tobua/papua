import handler from 'serve-handler'
import http from 'http'
import { log, freePort } from '../utility/helper.js'
import { options } from '../utility/options.js'
import build from './build.js'

export default async () => {
  await build(false)

  const configuration = {
    public: options().output,
    ...options().serve,
  }

  const server = http.createServer((request, response) =>
    handler(request, response, configuration)
  )

  const port = await freePort()

  server.listen(port, () => {
    log(`Serving /${configuration.public} from localhost:${port}`)
  })
}
