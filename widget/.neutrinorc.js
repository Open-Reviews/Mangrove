const airbnb = require('@neutrinojs/airbnb');
const react = require('@neutrinojs/react');
const jest = require('@neutrinojs/jest');
const sourcemap = require('@constgen/neutrino-sourcemap');
const manifest = require('./package.json');
const Dotenv = require('dotenv-webpack');

const version = manifest.version;
const env = process.env.NODE_ENV;

module.exports = {
  options: {
    root: __dirname,
    output: 'dist',
  },
  use: [
    airbnb(),
    react({
      publicPath: env === 'stg-deploy' ? '/widget/' : '/',
      html: {
        title: 'Open Reviews Widget Example',
        template: './template-widget-example.ejs',
      },
      style: {
        extract: {
          plugin: {
            filename: env === 'deploy' ? 'or-widget.css' : 'or-widget-' + version + '.css',
          },
        },
      },
    }),
    jest({
      setupFiles: ['./src/jest.setup.env.js'],
      setupFilesAfterEnv: ['./src/jest.setup.js'],
    }),
    sourcemap({
      prod: false,
      dev: true,
    }),

    (neutrino) => {
      neutrino.config.output
        .library('OpenReviewsWidget')
        .path(neutrino.options.output)
        .filename(env === 'deploy' ? 'or-widget.js' : 'or-widget-' + version + '.js')
        .libraryTarget('umd')
        .umdNamedDefine(true);

      neutrino.config.resolve.alias.set('react-dom', '@hot-loader/react-dom');

      neutrino.config
        .plugin('provide')
        .use(require.resolve('webpack/lib/ProvidePlugin'), [{ Buffer: ['buffer', 'Buffer'] }]);

      neutrino.config.plugin('dotenv').use(new Dotenv({ systemvars: true }), []);

      neutrino.config.optimization.runtimeChunk(false).splitChunks({
        cacheGroups: {
          default: false,
        },
      });

      neutrino.config.performance.hints(false);
    },
  ],
};
