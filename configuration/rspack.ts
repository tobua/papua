import { RspackOptions } from '@rspack/core'
// import TypeScriptWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import { htmlPlugin } from './rspack-html'

export default (development: boolean) =>
  ({
    entry: {
      main: './index.js',
    },
    output: {
      filename: development ? '[name].js' : '[name].[contenthash].js',
    },
    devtool: development ? 'cheap-module-source-map' : 'source-map',
    plugins: [htmlPlugin()], // new TypeScriptWebpackPlugin() doesn't work yet.
  } as RspackOptions)
