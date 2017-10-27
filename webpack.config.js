const path = require('path');
module.exports = {
    entry: './src/client.js',
    output: {
        path: path.resolve('./dist'),
        filename: 'app.js'
    },
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
        ]
    },
};