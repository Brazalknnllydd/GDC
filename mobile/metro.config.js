const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_enableSymlinks = true;
config.resolver.sourceExts.push('mjs', 'cjs');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@tanstack/react-query')) {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@tanstack/react-query/build/modern/index.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName.startsWith('@tanstack/query-core')) {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@tanstack/query-core/build/modern/index.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
