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

export type Dependencies = { [key: string]: string }

export interface Package {
  $schema?: string
  name?: string
  version?: string
  papua?: Object
  dependencies?: Dependencies
  devDependencies?: Dependencies
  peerDependencies?: Dependencies
  localDependencies?: Dependencies
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
  root: boolean
  serve?: ServeConfig
  localDependencies: boolean
}
