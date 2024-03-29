import { join } from 'path'
import { check } from 'tcp-port-used'
import { test, expect, afterEach, vi } from 'vitest'
import {
  environment,
  prepare,
  packageJson,
  file,
  listFilesMatching,
  wait,
  readFile,
} from 'jest-fixture'
import { HtmlRspackPlugin } from '@rspack/core'
import { createRspackConfig } from './utility/configuration'
import { start } from '../index'

const [fixturePath] = environment('start')

afterEach(() => {
  // resetMocks or resetModules will have no effect.
  vi.doUnmock(join(fixturePath, 'rspack.config.js'))
})

const rspackConfig = createRspackConfig()

test('Start script builds assets and occupies port.', async () => {
  prepare([packageJson('start'), file('index.js', `console.log('start-script')`)])

  const { url, port, stop } = await start({})

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

test('devServer can also be configured through rspack.config.js.', async () => {
  // Virtual mock, so that file doesn't necessarly have to exist.
  vi.doMock(join(fixturePath, 'rspack.config.js'), () => rspackConfig)

  const port = 1337

  prepare([
    packageJson('rspack-dev-server-config'),
    file('index.js', `import './logo.load.png'; console.log('public-path')`),
    {
      name: 'logo.load.png',
      copy: 'test/asset/logo.png',
    },
  ])

  rspackConfig.default = {
    devServer: {
      port,
      devMiddleware: {
        publicPath: '/nested/',
      },
    },
  }

  const { url, port: resultPort, stop } = await start()

  // Url will only be adapted when set through papua options in package.
  expect(url).toEqual(`localhost:${port}`)
  expect(resultPort).toBe(port)

  expect(await check(port, 'localhost')).toEqual(true)

  const html = await (await fetch(`http://localhost:${port}/nested/index.html`)).text()
  const mainJsContents = await (await fetch(`http://localhost:${port}/nested/main.js`)).text()

  expect(html).toContain('rspack-dev-server-config App')
  expect(mainJsContents).toContain('public-path')

  await stop()

  expect(await check(port, 'localhost')).toEqual(false)
})

test('rspack.config.js also works with multiple devServer properties that are then merged.', async () => {
  // Virtual mock, so that file doesn't necessarly have to exist.
  vi.doMock(join(fixturePath, 'rspack.config.js'), () => rspackConfig)

  const port = 1337

  prepare([
    packageJson('rspack-dev-server-multiple', { papua: { publicPath: '/nested/' } }),
    file('first.js', `import './logo.load.png'; console.log("first")`),
    file('second.js', `import './logo.load.png'; console.log("second")`),
    {
      name: 'logo.load.png',
      copy: 'test/asset/logo.png',
    },
  ])

  rspackConfig.default = [
    {
      entry: { first: 'first.js' },
      devServer: {
        port,
      },
    },
    {
      entry: { second: 'second.js' },
      plugins: [
        new HtmlRspackPlugin({
          filename: 'second.html',
        }),
      ],
      devServer: {
        devMiddleware: {
          publicPath: '/nested/',
        },
      },
    },
  ]

  const { url, port: resultPort, stop } = await start()

  // Url will only be adapted when set through papua options in package.
  expect(url).toEqual(`localhost:${port}`)
  expect(resultPort).toBe(port)

  expect(await check(port, 'localhost')).toEqual(true)

  const firstHtml = await (await fetch(`http://localhost:${port}/nested/index.html`)).text()
  const secondHtml = await (await fetch(`http://localhost:${port}/nested/second.html`)).text()
  const firstJsContents = await (await fetch(`http://localhost:${port}/nested/first.js`)).text()
  const secondJsContents = await (await fetch(`http://localhost:${port}/nested/second.js`)).text()

  expect(firstHtml).toContain('src="/nested/first.js"')
  expect(secondHtml).toContain('src="/nested/second.js"')
  expect(firstJsContents).toContain('"first"')
  expect(secondJsContents).toContain('"second"')

  await stop()

  expect(await check(port, 'localhost')).toEqual(false)
}, 10000) // NOTE timed out on windows.

test('Files can be written to disk by dev-server.', async () => {
  const { dist } = prepare([packageJson('start'), file('index.js', `console.log('start-script')`)])

  const { stop } = await start({
    devMiddleware: {
      writeToDisk: true,
    },
  })

  await wait(1)

  const files = listFilesMatching('*', dist)

  expect(files.length).toBe(2)
  expect(files).toContain('index.html')
  expect(files).toContain('main.js')

  expect(readFile(join(dist, 'index.html'))).toContain('start App')
  expect(readFile(join(dist, 'main.js'))).toContain('start-script')

  await stop()
})
