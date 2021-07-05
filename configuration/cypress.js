export const cypress = (cypressUserOverrides = {}) => ({
  chromeWebSecurity: false,
  ...cypressUserOverrides,
})
