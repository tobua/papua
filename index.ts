import * as scripts from './script/index'
import { writeConfiguration } from './utility/configuration'

// TODO postinstall?
export const configure = () => writeConfiguration()

export const start = (options, inputs) => scripts.start(options, inputs)

export const build = () => scripts.build()

export const watch = () => scripts.watch()

export const test = () => scripts.test()

export const lint = () => scripts.lint()

export const serve = (options) => scripts.serve(options)

export const update = () => scripts.update()

export const eject = (options) => scripts.eject(options)
