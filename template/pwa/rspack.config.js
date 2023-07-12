import { InjectManifestPlugin } from 'inject-manifest-plugin'

export default (configuration) => {
  configuration.builtins.html[0].excludedChunks = ['service-worker']

  return {
    plugins: [
      new InjectManifestPlugin({
        file: 'service-worker.ts',
      }),
    ],
  }
}
