'use strict';


module.exports = app => {
  return async (ctx, next) => {
    console.log('++++++++++++++++++++', app.config.env);
    await next();
  };
};
