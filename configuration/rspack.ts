import { resolve, join } from 'path'
import type { RspackOptions } from '@rspack/core'
import urlJoin from 'url-join'
import { options } from '../utility/options'
import { getProjectBasePath } from '../utility/path'
import { getPlugins } from './rspack-plugins'

const root = (folder: string) => resolve(process.cwd(), folder)

const getRoots = () => {
  const paths = []

  // To allow absolute imports from root, without tons of ../..
  // and making it easy to copy code and move files around.
  if (options().root) {
    paths.push(root('.'))
  }

  if (options().localDependencies) {
    paths.push(join(process.cwd(), 'node_modules'))
  }

  paths.push('node_modules')

  return paths
}

const getPublicPath = () => {
  if (options().publicPath) {
    // Require leading and trailing slashes, use url-join for Browser compatible paths.
    // Double-slashes are never valid, but can result from url-join.
    return urlJoin('/', options().publicPath, '/').replace('//', '/')
  }

  return ''
}

const getSourceMap = (development: boolean) => {
  if (development) {
    // Inlined quick source map.
    return 'eval-cheap-module-source-map'
  }

  if (options().sourceMap) {
    // .js.map file with high quality source map for production debugging.
    return 'source-map'
  }

  // By default no source maps in production for obfuscation.
  return false
}

const getTarget = () => {
  const targets: RspackOptions['target'] = ['web']
  const version = options().esVersion

  if (typeof version === 'string') {
    targets.push(version)
  }

  return targets
}

export default (development: boolean, isFirst: boolean): RspackOptions => {
  const esVersionSpecified = options().esVersion && options().esVersion !== 'browserslist'
  const transformEnv = !options().esVersion
    ? {
        mode: 'entry',
        targets: ['last 3 versions', '> 1%', 'not dead'],
      }
    : undefined

  return {
    target: getTarget(),
    mode: development ? 'development' : 'production',
    entry: options().entry,
    output: {
      filename: development || !options().hash ? '[name].js' : '[name].[contenthash].js',
      path: join(getProjectBasePath(), options().output),
      publicPath: getPublicPath(),
      // Path not required when hash is present, shortens paths.
      assetModuleFilename:
        development || !options().hash ? '[path][name][ext][query]' : '[hash][ext][query]',
    },
    devtool: getSourceMap(development),
    plugins: getPlugins(development, getPublicPath(), isFirst),
    resolve: {
      modules: getRoots(),
      extensions: ['...', '.tsx', '.ts', '.jsx'], // "..." means to extend from the default extensions
    },
    module: {
      // Matched from bottom to top!
      rules: [
        // Images
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset', // Auto-detect: Inline if < 8kb, external otherwise.
        },
        {
          test: /\.inline\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/inline', // Inline *.inline.svg files in JavaScript using base64 dataURI.
        },
        {
          test: /\.load\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource', // Convert *.load.png asset to separate file loaded through request.
        },
        // Fonts
        {
          test: /\.(woff|woff2|otf|ttf)$/i,
          type: 'asset/resource',
        },
        // Transform using built-in SWC.
        {
          test: /.js$/, // JavaScript without JSX.
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'ecmascript',
                  jsx: false,
                },
                target: esVersionSpecified ? options().esVersion : undefined,
              },
              env: transformEnv,
            },
          },
        },
        {
          test: /.jsx$/, // JavaScript with JSX.
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'ecmascript',
                  jsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development,
                    refresh: development,
                  },
                },
                target: esVersionSpecified ? options().esVersion : undefined,
              },
              env: transformEnv,
            },
          },
        },
        {
          test: /.ts$/, // TypeScript without JSX.
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  jsx: false,
                },
                target: esVersionSpecified ? options().esVersion : undefined,
              },
              env: transformEnv,
            },
          },
        },
        {
          test: /.tsx$/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  jsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development,
                    refresh: development,
                  },
                },
                target: esVersionSpecified ? options().esVersion : undefined,
              },
              env: transformEnv,
            },
          },
        },
      ],
    },
  }
}
