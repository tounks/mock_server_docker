/* eslint valid-jsdoc: "off" */
'use strict';
/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1557214542162_9023';

  // add your middleware config here
  config.middleware = [ ];
  config.cors = {
    allowMethods: 'GET,PUT,POST,DELETE,OPTIONS',
    // credentials: true,
    origin: '*',
  };
  config.security = {
    csrf: {
      enable: false,
    },
  };
  config.view = {
    defaultViewEngine: 'nunjucks',
    defaultExtension: '.nj',
    mapping: {
      '.nj': 'nunjucks',
    },
  };
  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
