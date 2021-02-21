const path = require('path');
const ESLintWebpackPlugin = require('eslint-webpack-plugin');

const ESLintPlugin = new ESLintWebpackPlugin({
    extensions: ['js', 'vue'],
    exclude: ['node_modules', 'dist', 'vendor']
});

module.exports = {
    plugins: [ESLintPlugin],

    resolve: {
        alias: {
            '@': path.resolve('resources/js')
        }
    },

    module: {
        rules: [
            {
                test: /\.postcss$/,
                use: ['style-loader', 'css-loader', 'postcss-loader'],
                include: path.resolve('resources')
            }
        ]
    }
};
