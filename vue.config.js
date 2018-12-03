module.exports = {
  // baseUrl: process.env.NODE_ENV === 'production'
  //   ? '/brain-control/'
  //   : '/',
  outputDir: 'docs',
  pages: {
    index: 'src/main.ts',
    "remote-controller": 'src/remote-controller/main.ts'
  },
  pwa: {
    themeColor: '#000000',
    msTileColor: '#000000'
  },
}
