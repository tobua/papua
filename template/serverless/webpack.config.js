import max from './api/count/[max].js'

export default {
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.get('/api/count/:max', max)
      return middlewares
    },
  },
}
