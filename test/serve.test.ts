import { existsSync } from 'fs'
import { join } from 'path'
import { check } from 'tcp-port-used'
import { test, expect } from 'vitest'
import {
  environment,
  prepare,
  packageJson,
  file,
  contentsForFilesMatching,
  writeFile,
  wait,
} from 'jest-fixture'
import { serve } from '../index'

environment('serve')

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

test('Build can be run in watch mode.', async () => {
  const { dist } = prepare([
    packageJson('serve-watch'),
    file('index.js', `console.log('serve-script')`),
  ])

  const { url, port, close } = await serve({ watch: true })

  await wait(0.5) // Wait until first build is done.

  expect(existsSync(join(dist, 'index.html'))).toEqual(true)

  expect(url).toEqual(`http://localhost:${port}`)

  expect(await check(port, 'localhost')).toEqual(true)

  expect(existsSync(dist)).toEqual(true)

  let jsContents = contentsForFilesMatching('*.js', dist)

  expect(jsContents[0].contents).toContain('serve-script')
  expect(jsContents[0].contents).not.toContain('changed_contents')

  writeFile('index.js', `console.log('changed_contents')`)

  await wait(0.5) // Wait to ensure watcher recompilation done.

  jsContents = contentsForFilesMatching('*.js', dist)

  expect(jsContents[0].contents).toContain('changed_contents')
  expect(jsContents[0].contents).not.toContain('serve-script')

  await close()

  expect(await check(port, 'localhost')).toEqual(false)
})
