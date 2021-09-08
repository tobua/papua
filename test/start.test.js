import { existsSync } from 'fs'
import { join } from 'path'
import tcpPortUsed from 'tcp-port-used'
import {
  environment,
  prepare,
  packageJson,
  file,
  listFilesMatching,
  contentsForFilesMatching,
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
    file('index.js', `console.log('start-script')`),
  ])

  const { url, port, server } = await start({
    open: false,
    devMiddleware: {
      writeToDisk: true,
    },
  })

  expect(url).toEqual(`localhost:${port}`)

  // Wait until first compilation is done.
  await wait(10)

  const portInUse = await tcpPortUsed.check(port)

  expect(portInUse).toEqual(true)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const files = listFilesMatching('*', dist)
  const mainJsContents = contentsForFilesMatching('*.js', dist)[0].contents

  // HTML, JS & MAP
  expect(files.length).toBe(3)

  expect(mainJsContents).toContain('start-script')

  await server.stop()
})
