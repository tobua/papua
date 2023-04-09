import { Options as HtmlOptions } from '@rspack/plugin-html'

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

// TODO types for user facing options??
// export interface Options {
//   test: false | string
//   entry: string[]
//   output: string
//   pkg: Package
//   tsconfig?: Object
//   gitignore?: string[]
//   hash: string
// }

export interface Options {
  output: string
  react: boolean
  entry: string[]
  typescript: boolean
  test: false | string
  publicPath: string
  workbox: Object
  hasTest: boolean
  title: string
  html: boolean | HtmlOptions
  icon: boolean | string
  serve?: ServeConfig
}
