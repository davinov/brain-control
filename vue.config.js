module.exports = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? '/brain-control/'
    : '/',
  outputDir: 'docs',
  pwa: {
    themeColor: '#000000',
    msTileColor: '#000000'
  }
}
