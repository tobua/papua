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
      // NOTE writeToDisk option currently disabled in @rspack/dev-middleware as it doesn't work yet.
      // https://github.com/web-infra-dev/rspack/blob/44dc1e8ba98eb21e9b412b59a551fd08c8747c35/packages/rspack-dev-middleware/src/index.ts
      writeToDisk: true,
    },
  })

  expect(url).toEqual(`localhost:${port}`)

  expect(await check(port, 'localhost')).toEqual(true)

  const html = await (await fetch(`http://localhost:${port}/index.html`)).text()
  const mainJsContents = await (await fetch(`http://localhost:${port}/main.js`)).text()

  expect(html).toContain('start App')
  expect(mainJsContents).toContain('start-script')

  await stop()

  expect(await check(port, 'localhost')).toEqual(false)
})

test('publicPath also works with devServer.', async () => {
  prepare([
    packageJson('start-public-path'),
    file('index.js', `import './logo.load.png'; console.log('public-path')`),
    {
      name: 'logo.load.png',
      copy: 'test/asset/logo.png',
    },
  ])

  const { url, port, stop } = await start({
    devMiddleware: {
      publicPath: '/nested/',
    },
  })

  // Url will only be adapted when set through papua options in package.
  expect(url).toEqual(`localhost:${port}`)

  expect(await check(port, 'localhost')).toEqual(true)

  const html = await (await fetch(`http://localhost:${port}/nested/index.html`)).text()
  const mainJsContents = await (await fetch(`http://localhost:${port}/nested/main.js`)).text()

  expect(html).toContain('start-public-path App')
  expect(mainJsContents).toContain('public-path')

  await stop()

  expect(await check(port, 'localhost')).toEqual(false)
})

test('publicPath from package configuration is used.', async () => {
  prepare([
    packageJson('start-public-path-package', {
      papua: {
        publicPath: '/nested/deep/',
      },
    }),
    file('index.js', `import './logo.load.png'; console.log('public-path')`),
    {
      name: 'logo.load.png',
      copy: 'test/asset/logo.png',
    },
  ])

  const { url, port, stop } = await start({})

  // Url will only be adapted when set through papua options in package.
  expect(url).toEqual(`localhost:${port}`)

  expect(await check(port, 'localhost')).toEqual(true)

  const html = await (await fetch(`http://localhost:${port}/nested/deep/index.html`)).text()
  const mainJsContents = await (await fetch(`http://localhost:${port}/nested/deep/main.js`)).text()

  expect(html).toContain('start-public-path-package App')
  expect(mainJsContents).toContain('public-path')

  await stop()

  expect(await check(port, 'localhost')).toEqual(false)
})
