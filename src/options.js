const invalid = name => !require('validate-npm-package-name')(name).validForNewPackages;
const fs = require('fs');
const {list} = require('fs-array');

module.exports = async (opt = {}) => {
  // Clone the object to avoid modifying the reference
  opt = JSON.parse(JSON.stringify(opt));
  //console.log("opts", opt)
  // Make sure it is of the right type
  if (typeof opt === 'string') opt = { routes: [opt] };
  if (Array.isArray(opt)) opt = { routes: opt };
  //opt.routes = opt.routes || [];

 /* if (opt.routes.length === 0) {
    console.log("ok1")
    if(!fs.existsSync("./node_modules")) {

      let test = await list("./")
      //test = test.filter((address) => fs.isDirectory(address))
    }
  }*/

  //const bad = opt.routes.find(invalid);
  //if (bad) {
  //  throw new Error(`Invalid package name: "${bad}"`);
  //}
  opt.output = opt.output || 'table';
  opt.show = opt.show || [];
  opt.show = Array.isArray(opt.show) ? opt.show : [opt.show];

  
  // Short names for showing only a special report
  if (opt.p) opt.show.push('packages');
  if (opt.l) opt.show.push('licenses');
  if (opt.r) opt.show.push('reports');
  if (opt.rl) opt.show.push('risky');

  if (!opt.show.length) opt.show = ['risky'];
  opt.filter = opt.filter || [];
  opt.type = opt.type || [];
  opt.plain = Boolean(opt.plain);

  opt.filter = Array.isArray(opt.filter) ? opt.filter : [opt.filter];
  opt.type = Array.isArray(opt.type) ? opt.type : [opt.type];

  opt.width = opt.width || 80;
  opt.width = typeof opt.width === 'number' ? opt.width : 80;
  //console.log(opt)
  return opt;
};
