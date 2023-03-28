import * as scripts from './script/index'
import { writeConfiguration } from './utility/configuration'

// TODO postinstall?
export const configure = () => writeConfiguration()

export const start = (options, inputs) => scripts.start(options, inputs)

export const build = (development: boolean) => scripts.build(development)

export const watch = (development: boolean) => scripts.watch(development)

export const test = () => scripts.test()

export const lint = () => scripts.lint()

export const serve = (options) => scripts.serve(options)

export const eject = (options) => scripts.eject(options)
