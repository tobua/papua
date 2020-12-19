import * as scripts from './script/index.js'
import { writeConfiguration } from './utility/configuration.js'

export const configure = () => writeConfiguration()

export const start = () => scripts.build(true)

export const build = () => scripts.build(false)

export const test = () => scripts.test()

export const lint = () => scripts.lint()

export const update = () => scripts.update()
