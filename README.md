<p align="center">
  <img src="https://github.com/tobua/papua/raw/master/logo.svg" alt="papua" width="500">
</p>

# papua

Setup and build modern web applications.

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

The following [templates](https://github.com/tobua/papua/tree/master/template) are available:

- default (JS + React)
- typescript (TS + React)
- pwa (TS + React + Progressive Web App)

```js
npm init now papua [destination-directory] [template]
```

### Existing Project

```js
npm i papua
```

This will automatically adapt your `package.json` configuration to work with `papua`.

## Usage

### `npm start`

Builds the application and opens it in the browser.

### `npm test`

Run tests if there are any.

### `npx papua build`

Builds the application for production. A production build will only be created if there are no lint errors and all tests have passed.

### `npx papua lint`

Lints the code and prints errors.

### `npx papua update`

Checks if there are updates to any npm packages and automatically updates them.

## Configuration

### JavaScript / TypeScript

`index.js` / `index.ts`

If there is a `index.ts` file available in the root the project will be configured for TypeScript.

`jsconfig.json` / `tsconfig.json`

To override the default configurations add the respective file with the changes. When building the app the file will be adapted to extend the default configuration.

### Template

`index.html`

If available papua will look for a HTML template in `index.html` and use a default fallback if none is available.

### webpack

`webpack.config.js`

You can add a webpack configuration file in the root. This configuration will then be merged with the default configuration. If you provide a function it will receive the default configuration and the mode as parameters.

```js
module.exports = (configuration, isDevelopment) => ({
  devServer: {
    before: (app) => {
      app.get('/say-hello', async (request, response) => {
        response.json({
          hello: 'world',
        })
      })
    },
  },
})
```
