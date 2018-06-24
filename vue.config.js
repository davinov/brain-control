module.exports = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? '/brain-control/'
    : '/',
  outputDir: 'docs'
}
