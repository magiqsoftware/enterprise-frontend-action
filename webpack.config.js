const path = require('path');

module.exports = {
    mode: 'production',
    devtool: 'source-map',
    entry: {
        index: './src/index.ts',
        cleanup: './src/cleanup.ts'
    },
    target: 'node',
    resolve: {
        extensions: ['.mjs', '.ts', '.js'],
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
};
