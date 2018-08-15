const path = require('path');
const webpack = require('webpack');

const execSync = require('child_process').execSync;
const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|ttf)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 50000,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '../dist'),
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        LOBBY_SERVER: JSON.stringify(
          process.env.LOBBY_SERVER || 'localhost:3000'
        ),
        ENABLE_SOCKET_LOG: 'true',
        BUILD_SHA: `"${sha}"`,
      },
    }),
  ],
};
