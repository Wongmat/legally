const table = require('./table');
const normal = require('./normalize');
const fs = require('fs');
const strategy = "./strategy.json"
const exList = JSON.parse(fs.readFileSync(strategy)).exclusions
const greenList = JSON.parse(fs.readFileSync(strategy)).greenList



const filters = ({ filter, type }) => lic => {
  lic = normal(lic);
  filter = filter.map(normal);
  type = type.map(normal);
  if (!lic || (!filter.length && !type.length)) return true;
  return filter.some(fil => lic.includes(fil)) || type.includes(lic);
}

module.exports = function(licenses, opt){
  var outputJSON = {}
  if (!Object.keys(licenses).length) {
    throw new Error('No modules found. Are you in the right directory?');
  }

  const display = item => item.filter(filters(opt)).join(' + ') || '-'; //join multiple licenses into one column
  const data = Object.entries(licenses).map(([ //preps data 
    name, { package: pack, copying, readme }
  ]) => [
    name, display(pack), display(copying), display(readme)
  ]);

  if (opt.show.includes('packages')) {
    /*if (opt.output === "table") {
    table(data, { //create ALL table
      'Module name': parseInt(25 * opt.width / 80),
      'package': parseInt(14 * opt.width / 80),
      'License': parseInt(14 * opt.width / 80),
      'README': parseInt(14 * opt.width / 80)
    }, { title: 'Packages (' + data.length + ')', repeat: 50, ...opt });
  } else {*/
    outputJSON.all = licenses
    fs.writeFile((opt.routes[0] || "") + "-allDependencies.json", JSON.stringify(licenses, null, 2), 'utf8', () => console.log("Report saved"))
  //}
  }

  // Count each of the licenses
  var count = data.reduce((all, one) => {
    //console.log("before", one)
    // Only valid names and make a unique license type per package
    one = [...new Set(one.slice(1)
      .reduce((all, one) => all.concat(one.split(' + ')), [])
      .filter(name => /^[^\?\-]/.test(name))
      .filter((name, i, all) => !(name === 'Apache' && all.includes('Apache 2.0')))
      .filter((name, i, all) => !(name === 'BSD' && all.find(a => /BSD\s\d/.test(a))))
    )];
    //console.log("after", one)
    one.forEach(o => { 
      //console.log(pack, o, greenList.includes(o))
      all[o] = (all[o] || 0) + 1; });
    return all;
  }, {});
  //console.log(count)
  var total = Object.keys(count).reduce((total, key) => total + count[key], 0);

  count = Object.keys(count)
    .map(name => ({ name: name, number: count[name], part: count[name] / total }))
    .sort(function(a, b){
      if (b.number !== a.number) return b.number - a.number;
      if(a.name < b.name) return -1;
      if(a.name > b.name) return 1;
      return 0;
    })
    .map((lic, i, all) => [lic.name, lic.number, parseInt(lic.part * 100) ]);

    if (opt.show.includes('risky')) {
      //console.log("risky opt", opt)
      let output = {}
     let risky = {}
     let diffVer = {}
     let excluded = {}
      data.reduce((all, one) => {
        let fullName = one[0]
        //console.log(one)
        one = [...new Set(one.slice(1)
          .reduce((all, one) => all.concat(one.split(' + ')), [])
          .filter(name => /^[^\?\-]/.test(name))
          .filter((name, i, all) => !(name === 'Apache' && all.includes('Apache 2.0')))
          .filter((name, i, all) => !(name === 'BSD' && all.find(a => /BSD\s\d/.test(a))))
      )];
          //console.log(packages)
          one.forEach((lic, index, all) => {
            //console.log(all)
            if (!greenList.includes(lic)) {
              //console.log(lic, index)
              lic = all.splice(index, 1)[0]
              
              let packName = fullName.split('@')[0]
              let currVer = fullName.split('@')[1]
              if (Object.keys(exList).includes(packName)) {
                if (exList[packName].version === currVer) {
                  let {license, reason} = exList[packName]
                  excluded[fullName] = {license: license, reason: reason}
                } 
                else diffVer[packName] = {currVer: currVer, exVer: exList[packName].version}
              }

              risky[fullName] = {license: lic, alt: all}
            } 
        
        })
      })
      let riskyKeys = Object.keys(risky)
      let excludedKeys = Object.keys(excluded)
      let folderName = opt.routes.length === 0 ? "" : opt.routes[0].substring(2)
      let remaining = riskyKeys.filter((package) => !excludedKeys.find(item => item[0] === package[0].split('@')[0]))
                               .reduce((obj, key) => (obj[key] = risky[key], obj), {})

      //console.log(packages)
      if (opt.output === "table") {
      table(risky, {
        'Package': parseInt(40 * opt.width / 80),
        'Non-Green License': parseInt(25 * opt.width / 80),
        'Alt. Licenses': parseInt(25 * opt.width / 80),
      }, Object.assign({ title: folderName + 'Risky Packages (' + riskyKeys.length + ') ', margin: 3 }, opt)
      );

      //console.log("risky", risky)
      if (excludedKeys.length > 0) {
      table(excluded, {
        'Package': parseInt(40 * opt.width / 80),
        'License': parseInt(25 * opt.width / 80),
        'Reason': parseInt(25 * opt.width / 80),
      }, Object.assign({ title: folderName + 'Found Exclusions (' + excludedKeys.length + ')', margin: 3 }, opt)
      );
    }

    if (Object.keys(diffVer).length > 0) {
      table(diffVer, {
        'Package': parseInt(40 * opt.width / 80),
        'Current Version': parseInt(25 * opt.width / 80),
        'Excluded Version': parseInt(25 * opt.width / 80),
      }, Object.assign({ title: folderName + 'Exclusion found for a different version (' + Object.keys(diffVer).length + ')', margin: 3 }, opt)
      );
    }

      //console.log("excluded", excluded) 

      table(remaining, {
        'Package': parseInt(40 * opt.width / 80),
        'Non-Green License': parseInt(25 * opt.width / 80),
        'Alt. Licenses': parseInt(25 * opt.width / 80),
      }, Object.assign({ title: folderName + 'No Exclusions (' + Object.keys(remaining).length + ')', margin: 3 }, opt)
      );
      //console.log("remaining", remaining)
    }
   else {
     let final = JSON.stringify({risky: risky, diffVer: diffVer, excluded: excluded, remaining, remaining}, null, 2)
     fs.writeFile(folderName + "-RiskReport.json", final, 'utf8', () => console.log("Risky Report saved"))
     outputJSON.riskyReport = JSON.parse(final)
   }
   
}

  if (opt.show.includes('licenses')) {
    table(count, {
      License: parseInt(40 * opt.width / 80),
      Number: parseInt(12 * opt.width / 80),
      '%': parseInt(12 * opt.width / 80)
    }, Object.assign({ title: 'Licenses (' + total + ')', margin: 3 }, opt)
    );
  }


  // REPORT

  /*var facts = [];

  var licensed = data.map(e => e.slice(1).join('')).filter(e => !/^\-+$/.test(e));

  if (licensed.length === data.length) {
    facts.push(['Great! All the dependencies are licensed']);
  } else {
    var notPerc = parseInt(100 * (data.length - licensed.length) / data.length);
    var notPart = (data.length - licensed.length) + '/' + data.length;
    var all = opt.type.concat(opt.filter);
    if (all.length) {
      var filtered = all.join('" NOR "');
      facts.push([notPerc + '% of the dependencies are not "' + filtered + '" (' + notPart + ')']);
    }
    else {
      facts.push([notPerc + '% of the dependencies are unlicensed (' + notPart + ')']);
    }
  }

  var verify = data.filter(e => e.slice(1).filter(e => /^\?/.test(e)).length);
  if (verify.length) {
    var one = verify.length === 1;
    facts.push(['There ' + (one ? 'is' : 'are') + ' ' + verify.length + ' dependenc' + (one ? 'y' : 'ies') + ' that could not be parsed automatically']);
    var sup = verify.map(one => one.slice(1).filter(e => !/^(-|\? verify)$/.test(e)));
    if (sup.length === verify.length) {
      facts.push(['  But ' + (one ? 'it has' : 'all of them have') + ' another valid license']);
    } else {
      one = verify.length - sup.length === 1;
      facts.push(['  And ' + (verify.length - sup.length) + (one ? 'has' : 'have') + ' no valid license']);
    }
  }

  if (opt.show.includes('reports')) {
    table(facts,
      [parseInt(70 * opt.width / 80)],
      Object.assign({ title: 'Reports', margin: 3 }, opt)
    );
  }*/
  return outputJSON
}
