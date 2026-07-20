const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    index: './src/index.ts',
    cleanup: './src/cleanup.ts',
  },
  target: 'node',
  resolve: {
    extensions: ['.mjs', '.ts', '.js'],
    // Resolve ESM-only deps (e.g. @actions/core v3) into the CommonJS bundle.
    conditionNames: ['import', 'require', 'node', 'default'],
  },
  output: {
    libraryTarget: 'commonjs2',
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
    ],
  },
  // Force each entry into a single self-contained file. AWS SDK v3 uses
  // dynamic import() (deferred credential loading), which webpack would
  // otherwise emit as separate chunk files; a GitHub Action ships one file
  // per entry, so inline them.
  plugins: [new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
};
