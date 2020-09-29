import colors from 'vuetify/es5/util/colors'

export default {
  ssr: false,
  /*
   ** Headers of the page
   */
  head: {
    titleTemplate: 'Mangrove Reviews',
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || ''
      },
      { 'initial-scale': 1.0 }
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },
  /*
   ** Global CSS
   */
  css: ['assets/global.css'],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    { src: '~/plugins/vue-layers', ssr: false },
    { src: '~/plugins/vue-line-clamp', ssr: false }
  ],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module',
    '@nuxtjs/vuetify'
  ],
  env: {
    BASE_URL: process.env.BASE_URL,
    VUE_APP_API_URL: process.env.VUE_APP_API_URL,
    VUE_APP_FILES_URL: process.env.VUE_APP_FILES_URL,
    VUE_APP_UPLOAD_URL: process.env.VUE_APP_UPLOAD_URL
  },
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    // Doc: https://github.com/nuxt-community/dotenv-module
    '@nuxtjs/dotenv',
    'nuxt-clipboard2'
  ],
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {
    retry: { retries: 3 }
  },
  /*
   ** vuetify module configuration
   ** https://github.com/nuxt-community/vuetify-module
   */
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      options: {
        customProperties: true
      },
      themes: {
        light: {
          // Filled stars
          primary: colors.deepOrange,
          // Buttons and selected list
          secondary: colors.yellow,
          // Star outlines
          accent: colors.deepOrange,
          background: colors.grey.lighten4
        },
        dark: {
          // Filled stars
          primary: colors.deepOrange.accent3,
          background: '#263238',
          // Star outlines
          accent: colors.deepOrange.accent3,
          // Buttons and selected list
          secondary: colors.yellow
        }
      }
    }
  },
  /*
   ** Build configuration
   */
  build: {
    extend(config, ctx) {
      // add frontmatter-markdown-loader
      config.module.rules.push({
        test: /\.md$/,
        loader: 'frontmatter-markdown-loader'
      })
    }
  }
}
