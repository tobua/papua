import * as scripts from './script/index.js'
import { writeConfiguration } from './utility/configuration.js'

export const configure = () => writeConfiguration()

export const start = (options) => scripts.start(options)

export const build = () => scripts.build()

export const watch = () => scripts.watch()

export const test = () => scripts.test()

export const lint = () => scripts.lint()

export const serve = () => scripts.serve()

export const update = () => scripts.update()

export const snow = () => scripts.snow()
