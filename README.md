<p align="center">
  <img src="https://github.com/tobua/papua/raw/main/logo.svg" alt="papua" width="500">
</p>

# papua

Setup and build modern web applications with **Rspack**, **TypeScript**, **React**, **ESLint**, **Prettier** and **Vitest** all without the need for any configuration at all.

⚠️ With Version 4.0.0 the plugin switches from **webpack** to **Rspack**, while largely compatible some migration might be necessary, see details in the [v4.0.0 Release](https://github.com/tobua/papua/releases/tag/v4.0.0).

## Installation

### New Project

```js
// Create default template in current directory.
npm init now papua
// Initialize default template in 'my-project' directory.
npm init now papua ./my-project
// Initialize TypeScript template in current directory.
npm init now papua . typescript
```

The following [templates](https://github.com/tobua/papua/tree/main/template) are available:

- default (JS + React)
- typescript (TS + React)
- [pwa](https://github.com/tobua/papua/tree/main/template/pwa) (TS + React + Progressive Web App) [Demo](https://papua-pwa.vercel.app)
- website (TS + React + MobX + Emotion)
- serverless (JS + React + Serverless Function)

```js
npm init now papua [destination-directory] [template]
```

### Existing Project

```js
npm i papua
```

This will automatically adapt your `package.json` configuration to work with `papua`.

## Usage

### `npm start | npx papua start [--port <number>] [--headless]`

Builds the application and opens it in the browser. Optionally a port can be set and the `--headless` flag won't open the page in a browser automatically.

### `npm test | npx papua test`

Run tests if there are any.

### `npx papua build`

Builds the application for production. A production build will only be created if there are no lint errors and all tests have passed.

### `npx papua lint`

Lints the code and prints errors.

### `npx papua serve [--port <number>] [--open]`

Builds the production assets and serves them. Can be configured through the `papua.serve` property in `package.json` see [Serve](https://github.com/vercel/serve-handler#options) for available options.

Arguments: `--open` open in default browser, `--port 5000` specify a port.

### `npx papua eject [--template <html | icon | rspack>] [--file <name>]`

Eject certain files to allow for more fine grained configuration. If no default values are provided the plugin will prompt for values. The following templates are available:

- HTML (index.html)
- Icon (logo.png)
- Rspack (rspack.config.js - file cannot be set)

### `npx papua watch`

Builds application in watch mode for development without opening it in the browser.

## Configuration

Most of the default configurations can easily be extended. To do that add
a `papua` property to your `package.json` with the following options available:

```js
{
  "name": "my-app",
  "papua": {
    // Output directory for build files, default 'dist'.
    output: 'build',
    // Is project written in TypeScript, automatically detected from extension (ts).
    typescript: true,
    // Does the project include React, automatically detected from extension (jsx, tsx).
    react: true,
    // Folder for tests with jest, default /test, test configuration enabled if `**.test.[jt]s*` files found inside.
    test: 'spec',
    // What's the name of the entry file, automatically adds [src/]?index.[jt]sx? file if available.
    entry: 'another.tsx',
    entry: ['another.js', 'several.jsx'],
    entry: { main: './index.js', separate: ['./chunk.js', 'second.js'] },
    // Public path where the files are served from, default '.'.
    publicPath: '/app',
    // App title used in the template.
    title: 'My papua App',
    // Configure html file to be generated.
    html: { template: 'page.html', filename: 'modern.html' },
    // Customize favicon.
    icon: 'my-favicon.ico',
    // Disable content hashes added to assets in production build.
    hash: false,
    // Passed to serve-handler in serve script.
    serve: {
      cleanUrls: false
    },
    // Configure cypress front end tests.
    cypress: {
      defaultCommandTimeout: 6000
    },
    // Options for workbox-webpack-plugin InjectManifest
    workbox: {
      exclude: ['extension/dist']
    },
    // Added to tsconfig.json, jsconfig.json.
    jsconfig: {},
    tsconfig: {
      compilerOptions: {
        removeComments: true
      }
    }
  }
}
```

### JavaScript / TypeScript

`index.js` / `index.ts` / `index.jsx` / `index.tsx`

If there is a `index.ts` / `index.tsx` file available in the root the project will be configured for TypeScript.

`jsconfig.json` / `tsconfig.json`

One of these files will automatically be created extending the default configuration. Options added to `package.json` will automatically be added. However, additions to the file can also be made manually and committed by removing the file from `.gitignore` if desired.

### Template

`index.html`

If available papua will look for a HTML template in `index.html` and use a default fallback if none is available. Use the `package.json` → `papua` → `html` option to configure the template to look for and other options passed to `@rspack/plugin-html`.

### Rspack

`rspack.config.js`

A rspack configuration file can be added in the root. This configuration will then be merged with the default configuration. If a function is exported the default configuration will be received with the mode as a parameter.

```js
import { join } from 'path'

// Custom webpack configuration to merge with papua default configuration.
export default (configuration, isDevelopment) => ({
  // Add mock API reusing the Webpack-Dev-Server Express instance.
  devServer: {
    onBeforeSetupMiddleware: (devServer) => {
      devServer.app.get('/say-hello', async (request, response) => {
        response.json({
          hello: 'world',
        })
      })
    },
  },
})

// Optionally edit the resulting configuration after merging.
export const after = (configuration) => {
  // Remove file-loader
  configuration.module.rules.splice(2, 1)
  // Return edited configuration
  return configuration
}
```
