const path = require('path');
const { CheckerPlugin } = require('awesome-typescript-loader');

module.exports = {
    entry: './src/client.tsx',
    output: {
        path: path.resolve('./dist'),
        filename: 'app.js'
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    module: {
        loaders: [
            { test: /\.(t|j)sx?$/, use: {loader: 'awesome-typescript-loader'}, exclude: /node_modules/ },
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
        ]
    },
    plugins: [
        new CheckerPlugin(),
    ],
    devtool: "source-map"
};