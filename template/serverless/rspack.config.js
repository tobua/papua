import max from './api/count/[max].js'

/** @type {import('@rspack/core').Configuration} */
export default {
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.get('/api/count/:max', max)
      return middlewares
    },
  },
}
