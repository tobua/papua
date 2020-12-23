/* eslint-env jest */
import { join } from 'path'
import { setup, reset, remove } from './fixture.js'
import { refresh } from '../../utility/helper.js'

// Access directory, before it's modified for tests.
const CWD = process.cwd()

// Waiting up to 5 minutes for async tests, npm install might take some time.
jest.setTimeout(300000)

export const prepare = (fixtureName, fixturePath) =>
  setup(fixtureName, fixturePath)

export const clear = (fixturePath) => reset(fixturePath)

export const environment = (testSuiteName) => {
  const currentDirectorySpy = jest.spyOn(process, 'cwd')
  const setCwd = (_path) => currentDirectorySpy.mockReturnValue(_path)
  const fixturePath = join(CWD, 'test/fixture', testSuiteName)

  beforeEach(() => {
    setCwd(fixturePath)
  })

  afterEach(() => {
    remove(fixturePath)
    // Remove cached package.json
    refresh()
  })

  return [fixturePath, setCwd]
}
