module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@tanstack/react-query': '@tanstack/react-query/build/modern/index.js',
            '@tanstack/query-core': '@tanstack/query-core/build/modern/index.js'
          }
        }
      ]
    ]
  };
};
