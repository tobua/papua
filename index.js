import * as scripts from './script/index.js'
import { getOptions } from './utility/options.js'
import { writeConfiguration } from './utility/configuration.js'

const options = getOptions()

writeConfiguration()

export const start = () => scripts.build(options, true)

export const build = () => scripts.build(options, false)

export const test = () => scripts.test(options)

export const lint = () => scripts.lint()

export const update = () => scripts.update()
