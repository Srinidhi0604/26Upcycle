const netlify = require('netlify-lambda');
const path = require('path');

// Configure the paths for your Lambda functions
netlify.config({
  babel: {
    presets: [
      ['@babel/preset-env', { targets: { node: '14' } }]
    ]
  },
  config: {
    // Directory where your Lambda functions will be built
    functions: {
      directory: path.join(__dirname, 'functions'),
      // Where the built functions will be placed
      distDir: path.join(__dirname, 'lambda')
    }
  }
});