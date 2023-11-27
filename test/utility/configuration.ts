import type { RspackOptions, MultiRspackOptions } from '@rspack/core'

type RspackConfigMock = {
  __esModule: boolean
  default?:
    | RspackOptions
    | MultiRspackOptions
    | ((configuration: RspackOptions, isDevelopment: boolean) => RspackOptions | MultiRspackOptions)
  after: Function | undefined
}

export const createRspackConfig = (): RspackConfigMock => ({
  __esModule: true,
  default: {},
  after: undefined, // Property required, as virtual mock fails otherwise.
})
