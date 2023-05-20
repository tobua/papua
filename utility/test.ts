export const isTest = () =>
  typeof process !== 'undefined' &&
  process.env.NODE_ENV === 'test' &&
  typeof process.env.PAPUA_TEST === 'string'
