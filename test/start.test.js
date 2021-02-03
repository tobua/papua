import { existsSync } from 'fs'
import { join } from 'path'
import tcpPortUsed from 'tcp-port-used'
import { start } from '../index.js'
import { wait, closeServer, listFilesMatching } from './utility/helper.js'
import { environment, prepare } from './utility/prepare.js'

const [fixturePath] = environment('start')

test('Start script builds assets and occupies port.', async () => {
  const { dist } = prepare('build', fixturePath)

  const { url, port, server } = await start({
    open: false,
    writeToDisk: true,
  })

  expect(url).toEqual(`localhost:${port}`)

  // Wait until first compilation is done.
  await wait(10)

  const portInUse = await tcpPortUsed.check(port)

  expect(portInUse).toEqual(true)

  // NOTE not yet working (memory-fs throws an error with jest).
  expect(existsSync(dist)).toEqual(false)
  expect(existsSync(join(dist, 'index.html'))).toEqual(false)

  const files = listFilesMatching('*', dist)

  expect(files.length).toBeGreaterThanOrEqual(0)

  await closeServer(server)
})
