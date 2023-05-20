import { existsSync } from 'fs'
import { join } from 'path'
import { check } from 'tcp-port-used'
import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import { registerVitest, environment, prepare, packageJson, file } from 'jest-fixture'
import { serve } from '../index'
import { refresh } from '../utility/helper'

process.env.PAPUA_TEST = process.cwd()

registerVitest(beforeEach, afterEach, vi)

environment('serve')

beforeEach(refresh)

test('Serve script builds assets in production and serves them on the default port.', async () => {
  const { dist } = prepare([packageJson('serve'), file('index.js', `console.log('serve-script')`)])

  expect(existsSync(dist)).toEqual(false)

  const { url, port, close } = await serve()

  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  expect(url).toEqual(`http://localhost:${port}`)

  expect(await check(port, 'localhost')).toEqual(true)

  const html = await (await fetch(`http://localhost:${port}/index.html`)).text()

  expect(html).toContain('serve App')

  await close()

  expect(await check(port, 'localhost')).toEqual(false)
})

test('Port can be customized.', async () => {
  prepare([packageJson('serve'), file('index.js', `console.log('serve-script')`)])

  const { url, port, close } = await serve({ port: 1337 })

  expect(port).toBe(1337)
  expect(url).toEqual(`http://localhost:${port}`)
  expect(await check(port, 'localhost')).toEqual(true)

  await close()

  expect(await check(port, 'localhost')).toEqual(false)
})
