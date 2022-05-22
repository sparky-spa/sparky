'use strict';

const path = require( 'path' );

module.exports = {
    // https://webpack.js.org/configuration/entry-context/
    entry: './js/core.js',

    // https://webpack.js.org/configuration/output/
    output: {
        path: path.resolve( __dirname, './assets/js' ),
        filename: 'sparky-spa.min.js'
    },

    // Useful for debugging.
    devtool: 'source-map',

    // By default webpack logs warnings if the bundle is bigger than 200kb.
    performance: { hints: false }
};
