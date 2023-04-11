import { Options as HtmlOptions } from '@rspack/plugin-html'
import type { WebpackInjectManifestOptions } from 'workbox-build'

interface Rewrite {
  source: string
  destination: string
}

interface Redirect extends Rewrite {
  type: number
}

interface Header {
  source: string
  headers: Array<{
    key: string
    value: string
  }>
}
// NOTE types not exported by serve-handler.
export interface ServeConfig {
  public?: string | undefined
  cleanUrls?: boolean | string[] | undefined
  rewrites?: Rewrite[] | undefined
  redirects?: Redirect[] | undefined
  headers?: Header[] | undefined
  directoryListing?: boolean | string[] | undefined
  unlisted?: string[] | undefined
  trailingSlash?: boolean | undefined
  renderSingle?: boolean | undefined
  symlinks?: boolean | undefined
  etag?: boolean | undefined
}

export interface Package {
  name?: string
  version?: string
  papua?: Object
  dependencies?: Object
  devDependencies?: Object
  peerDependencies?: Object
  localDependencies?: Object
  scripts?: {
    start?: string
    build?: string
    test?: string
  }
  type: 'module'
  main?: string
  engines: {
    node?: string
  }
  prettier: string
  eslintConfig?: {
    extends?: string
  }
  stylelint?: {
    extends?: string
  }
}

export type Entry = string | string[] | { [key: string]: string | string[] }
export type NormalizedEntry = string[] | { [key: string]: string[] }

export interface Options {
  output: string
  react: boolean
  entry: NormalizedEntry
  typescript: boolean
  test: false | string
  publicPath: string
  workbox: WebpackInjectManifestOptions
  hasTest: boolean
  title: string
  html: boolean | HtmlOptions
  icon: boolean | string
  hash: boolean
  serve?: ServeConfig
}
