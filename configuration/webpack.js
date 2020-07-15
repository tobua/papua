import { resolve } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'

const root = (folder) => resolve(process.cwd(), folder)

export default (env) => ({
  entry: ['core-js/stable', 'regenerator-runtime/runtime', './index.js'],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              ['@babel/plugin-proposal-class-properties', { loose: true }],
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ],
  resolve: {
    modules: [root('.'), 'node_modules'],
  },
  devServer: {
    port: 2000,
    open: true,
    writeToDisk: true,
  },
  performance: {
    hints: false,
  },
  stats: {
    children: false,
  },
})
