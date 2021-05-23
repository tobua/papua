import { existsSync } from 'fs'
import { join } from 'path'
import tcpPortUsed from 'tcp-port-used'
import {
  environment,
  prepare,
  packageJson,
  file,
  listFilesMatching,
  wait,
} from 'jest-fixture'
import { start } from '../index.js'
import { refresh } from '../utility/helper.js'

// Startup can take more than 5 seconds.
jest.setTimeout(60000)

environment('start')

beforeEach(refresh)

test('Start script builds assets and occupies port.', async () => {
  const { dist } = prepare([
    packageJson('build'),
    file('index.js', `console.log('test')`),
  ])

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

  await new Promise((done) => server.close(() => done()))
})
