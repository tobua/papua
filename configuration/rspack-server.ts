import { join } from 'path'
import { Configuration } from '@rspack/dev-server'
import { options } from '../utility/options'
import { isTest } from '../utility/test'

const removeLeadingSlash = (path: string) => path.replace(/^\/*/, '')

export const devServer = (port = 3000, headless = false) => {
  const baseConfiguration = {
    port,
    open: !headless && !isTest(),
    host: 'localhost',
    // Redirect all routes to index.html (useful with router).
    historyApiFallback: true,
    devMiddleware: {
      // Prevent errors from falling back to regular logs.
      stats: 'none',
    },
  } as Configuration

  if (options().publicPath) {
    baseConfiguration.open = !isTest() && (removeLeadingSlash(options().publicPath) || '/')
    // Leading and trailing slashes required.
    // Leading slash for bundle and trailing for assets.
    const publicPathWithSlashes = join('/', options().publicPath, '/')
    baseConfiguration.devMiddleware.publicPath = publicPathWithSlashes

    // Rewrite index requests to public path.
    baseConfiguration.historyApiFallback = {
      index: publicPathWithSlashes,
      // Route every request to index.html (SPA assumed).
      rewrites: [{ from: /./, to: join(publicPathWithSlashes, 'index.html') }],
    }
  }

  return baseConfiguration
}
