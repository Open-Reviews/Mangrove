const airbnb = require('@neutrinojs/airbnb');
const react = require('@neutrinojs/react');
const jest = require('@neutrinojs/jest');
const sourcemap = require('@constgen/neutrino-sourcemap');
const manifest = require('./package.json');

const version = manifest.version;

module.exports = {
  options: {
    root: __dirname,
    output: 'dist',
  },
  use: [
    airbnb(),
    react({
      html: {
        title: 'Open Reviews Widget Example',
        template: './template-widget-example.ejs',
      },
      style: {
        extract: {
          plugin: {
            filename: 'or-widget-' + version + '.css',
          },
        },
      },
    }),
    jest(),
    sourcemap({
      prod: false,
      dev: true,
    }),

    (neutrino) => {
      neutrino.config.output
        .library('OpenReviewsWidget')
        .path(neutrino.options.output)
        .filename('or-widget-' + version + '.js')
        .libraryTarget('umd')
        .umdNamedDefine(true);

      neutrino.config.resolve.alias.set('react-dom', '@hot-loader/react-dom');

      neutrino.config
        .plugin('provide')
        .use(require.resolve('webpack/lib/ProvidePlugin'), [{ Buffer: ['buffer', 'Buffer'] }]);

      neutrino.config.plugin('dotenv').use(require.resolve('dotenv-webpack'), []);

      neutrino.config.optimization.runtimeChunk(false).splitChunks({
        cacheGroups: {
          default: false,
        },
      });

      neutrino.config.performance.hints(false);
    },
  ],
};
