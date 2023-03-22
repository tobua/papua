import { existsSync } from 'fs'
import { join } from 'path'
import { check } from 'tcp-port-used'
import {
  environment,
  prepare,
  packageJson,
  file,
  listFilesMatching,
  contentsForFilesMatching,
  wait,
} from 'jest-fixture'
import { start } from '../index'
import { refresh } from '../utility/helper'

// Startup can take more than 5 seconds.
jest.setTimeout(60000)

environment('start')

beforeEach(refresh)

test('Start script builds assets and occupies port.', async () => {
  const { dist } = prepare([packageJson('build'), file('index.js', `console.log('start-script')`)])

  const { url, port, server } = await start({
    open: false,
    devMiddleware: {
      writeToDisk: true,
    },
  })

  expect(url).toEqual(`localhost:${port}`)

  // Wait until first compilation is done.
  await wait(30)

  const portInUse = await check(port, 'localhost')
  expect(portInUse).toEqual(true)

  expect(existsSync(dist)).toEqual(true)
  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  const files = listFilesMatching('*', dist)
  const mainJsContents = contentsForFilesMatching('main.js', dist)[0].contents

  // HTML, JS & MAP
  expect(files).toContain('index.html')
  expect(files).toContain('main.js')
  expect(files).toContain('main.js.map')
  expect(files.filter((fileName) => !fileName.includes('hot-update')).length).toBe(3)

  expect(mainJsContents).toContain('start-script')

  await server.stop()
})
