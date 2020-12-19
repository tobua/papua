/* eslint-env jest */
import { join } from 'path'
import { setup, reset, remove } from './fixture.js'

// Waiting up to 5 minutes for async tests, npm install might take some time.
jest.setTimeout(300000)

export const prepare = (suiteName) => {
  const currentDirectorySpy = jest.spyOn(process, 'cwd')
  const setCwd = (_path) => currentDirectorySpy.mockReturnValue(_path)

  beforeAll(() => {
    // global.PATH can later be used in tests.
    global.PATH = setup(suiteName)
  })

  beforeEach(() => {
    setCwd(join(global.PATH))
  })

  afterEach(() => reset(global.PATH))

  afterAll(() => remove(global.PATH))
}
