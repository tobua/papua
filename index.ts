import * as scripts from './script/index'
import { writeConfiguration } from './utility/configuration'

// TODO postinstall?
export const configure = () => writeConfiguration()

export const { start, build, watch, test, lint, serve, eject } = scripts
