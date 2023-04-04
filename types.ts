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
  html: boolean
}
