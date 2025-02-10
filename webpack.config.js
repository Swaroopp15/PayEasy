const path = require('path');

module.exports = {
    entry: './public/firebase-auth.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: 'development',
};