'use strict';
const Mock = require('mockjs');

const Controller = require('egg').Controller;

class SwaggerController extends Controller {
  async index() {
    const { ctx, app } = this;
    this.currentPro = '';
    const project = {
      '/live-api-todo': {
        name: 'ai直播',
        url: 'http://swagger.zhiyitech.cn/live/v2/api-docs',
      },
      '/api-todo': {
        name: 'ai数据',
        url: 'http://swagger.zhiyitech.cn/dataline/v2/api-docs',
      },
      '/bi-api-todo': {
        name: 'ai趋势',
        url: 'http://swagger.zhiyitech.cn/fashion/v2/api-docs',
      },
    };
    const getSwaggerUrl = url => {
      let tmp = '';
      Object.keys(project).forEach(pro => {
        if (url.startsWith(pro)) {
          tmp = project[pro].url;
          this.currentPro = pro;
        }
      });
      return tmp;
    };
    const url = getSwaggerUrl(ctx.request.url);
    if (!url) {
      ctx.body = await ctx.renderView('noUrl', { project });
      return;
    }
    this.result = await app.curl(url, { dataType: 'json' });
    const randomImg = [
      'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1557747177857&di=438ce0c56411fee998a7bb624e8e97eb&imgtype=0&src=http%3A%2F%2F01.minipic.eastday.com%2F20170527%2F20170527000054_d41d8cd98f00b204e9800998ecf8427e_10.jpeg',
      'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1557747179720&di=1966be33197d58f7dde809fefc9e2b94&imgtype=0&src=http%3A%2F%2Fhbimg.b0.upaiyun.com%2F57a32018721e96d0a1c840c53f9003d24bac0bb418da7-5EPEsA_fw658',
      'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1557747180763&di=ecff75ceb050351c09b322416ed74239&imgtype=0&src=http%3A%2F%2F01.minipic.eastday.com%2F20170523%2F20170523113106_a3075cec141b772bae2c63c998604fb1_2.jpeg',
      'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1557747182958&di=0bc4b99c6fbdad3a644964e12fbcacaa&imgtype=0&src=http%3A%2F%2Fi2.hdslb.com%2Fbfs%2Farchive%2Fb01296b77f175f7fe466d9cd807d9825425434a9.jpg',
    ];
    const { paths, definitions } = this.result.data;
    // 获取真正的url
    let realUrl = ctx.request.url;
    if (realUrl.includes('?')) {
      realUrl = realUrl.split('?')[0];
    }
    realUrl = realUrl.replace(this.currentPro, '');
    // 获取允许的请求method
    const realMethod = Object.keys(paths[realUrl]);
    if (!realMethod.includes(ctx.request.method.toLocaleLowerCase())) {
      ctx.body = `sb method error 允许的方法:${realMethod.join(',')}`;
      return;
    }
    // 获取所有参数
    // const allParams = paths[realUrl][ctx.request.method.toLocaleLowerCase()].parameters || [];
    // 获取必须参数
    // const mustParams = allParams.filter(param => param.require);
    // 获取response 200状态返回信息
    const resSchema = paths[realUrl][ctx.request.method.toLocaleLowerCase()].responses[200].schema.$ref.replace('#/definitions/', '');
    // 获取返回对象
    const resObject = definitions[resSchema];
    const { properties } = resObject;

    const random = (type, item, ...rule) => {
      if (type === 'number') type = 'integer';
      // https://github.com/nuysoft/Mock/wiki/Basic
      if (type === 'object') {
        return Mock.mock({
          'object|2': {
            310000: '上海市',
            320000: '江苏省',
            330000: '浙江省',
            340000: '安徽省',
          },
        }).object;
      }
      if (type === 'string' && item.description) {
        if (item.description.includes('链接')) {
          return randomImg[Math.floor(Math.random() * randomImg.length)];
        } else if (item.description.includes('时间') || item.description.includes('日期')) {
          return Mock.Random.date();
        }
      }
      if (!rule.length) {
        switch (type) {
          case 'integer':rule = [ 1, 5 ]; break;
          default:break;
        }
      }
      return Mock.Random[type](...rule);
    };

    const dealResObj = properties => {
      Object.keys(properties).forEach(item => {
        if (item === '$ref') {
          Object.assign(properties, definitions[properties[item].replace('#/definitions/', '')]);
          delete properties.$ref;
          dealResObj(properties);
        }
        if (item === 'properties') {
          Object.assign(properties, properties[item]);
          delete properties[item];
          delete properties.type;
          dealResObj(properties);
        }
        if (typeof properties[item] === 'object') {
          dealResObj(properties[item]);
        }
      });
    };
    const randomArray = arrayObj => {
      const result = [];
      for (let i = 0; i < random('integer', {}, 1, 20); i++) {
        const tmp = {};
        this.randomObj(arrayObj, tmp);
        Object.keys(tmp).forEach(key => {
          if (key === 'items') {
            result.push(tmp[key]);
          }
        });
      }
      return result;
    };
    const newObj = {};
    this.randomObj = (obj, newObj, key) => {
      if (key) newObj[key] = {};
      Object.keys(obj).forEach(item => {
        if (obj[item].hasOwnProperty('type')) {
          switch (obj[item].type) {
            case 'integer':
            case 'number':
            case 'float':
            case 'double':
            case 'object':
            case 'string': key ? newObj[key][item] = random(obj[item].type, obj[item]) : newObj[item] = random(obj[item].type, obj[item]); break;
            case 'boolean': key ? newObj[key][item] = true : newObj[item] = true; break;
            case 'array': key ? newObj[key][item] = randomArray(obj[item]) : newObj[item] = randomArray(obj[item]); break;
            default:break;
          }
        } else {
          if (typeof obj[item] === 'object') {
            this.randomObj(obj[item], key ? newObj[key] : newObj, item);
          }
        }
      });
    };
    dealResObj(properties);
    const randomResult = JSON.parse(JSON.stringify(properties));
    this.randomObj(randomResult, newObj);
    ctx.body = newObj;
    // ctx.body = `所有参数列表:\n${JSON.stringify(allParams)}\n必传参数列表:\n${JSON.stringify(mustParams)}\n返回结果:\n${JSON.stringify(properties)}\n随机结果:\n${JSON.stringify(newObj)}`;
  }
}

module.exports = SwaggerController;
