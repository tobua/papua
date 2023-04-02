import { check } from 'tcp-port-used'
import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import { registerVitest, environment, prepare, packageJson, file } from 'jest-fixture'
import { start } from '../index'
import { refresh } from '../utility/helper'

registerVitest(beforeEach, afterEach, vi)

environment('start')

beforeEach(refresh)

test('Start script builds assets and occupies port.', async () => {
  prepare([packageJson('start'), file('index.js', `console.log('start-script')`)])

  const { url, port, stop } = await start({
    devMiddleware: {
      writeToDisk: true,
    },
  })

  expect(url).toEqual(`localhost:${port}`)

  expect(await check(port, 'localhost')).toEqual(true)

  // NOTE writeToDisk option currently disabled in @rspack/dev-middleware as it doesn't work yet.
  // https://github.com/web-infra-dev/rspack/blob/44dc1e8ba98eb21e9b412b59a551fd08c8747c35/packages/rspack-dev-middleware/src/index.ts

  const html = await (await fetch(`http://localhost:${port}/index.html`)).text()

  expect(html).toContain('start App')

  await stop()

  expect(await check(port, 'localhost')).toEqual(false)

  // expect(existsSync(dist)).toEqual(true)
  // expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  // const files = listFilesMatching('*', dist)
  // const mainJsContents = contentsForFilesMatching('main.js', dist)[0].contents

  // // HTML, JS & MAP
  // expect(files).toContain('index.html')
  // expect(files).toContain('main.js')
  // expect(files).toContain('main.js.map')
  // expect(files.filter((fileName) => !fileName.includes('hot-update')).length).toBe(3)

  // expect(mainJsContents).toContain('start-script')
})
