import { RspackOptions, MultiCompilerOptions } from '@rspack/core'
import { Options } from '@rspack/plugin-html'

export type HtmlRspackOptions = RspackOptions & { html?: boolean | Options }
export type MultiHtmlRspackOptions = ReadonlyArray<HtmlRspackOptions> & MultiCompilerOptions

type RspackConfigMock = {
  __esModule: boolean
  default:
    | HtmlRspackOptions
    | MultiHtmlRspackOptions
    | ((
        configuration: RspackOptions,
        isDevelopment: boolean
      ) => HtmlRspackOptions | MultiHtmlRspackOptions)
  after: Function | undefined
}

export const createRspackConfig = (): RspackConfigMock => ({
  __esModule: true,
  default: {},
  after: undefined, // Property required, as virtual mock fails otherwise.
})
