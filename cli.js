#!/usr/bin/env node

// This bit only handles the Command Line Interface API, while the index.js
// handles the actual parsing
const minimist = require('minimist');
const legally = require('./');
const analysis = require('./src/analysis');
const clean = require('./src/options')
const pScan = require('./src/python-scan')
const args = minimist(process.argv.filter(e => !/^\/.+$/.test(e)), {
  string: 'output'
});
const { lstatSync, readdirSync, existsSync, writeFile} = require('fs')
const { join } = require('path')
const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)).filter(isDirectory)

// node on windows inserts extra into argv that we need to remove
// could be a bug in minimist
if (/^win/.test(process.platform)) args._ = args._.slice(2);

args.routes = args._;
// Need to wait a bit before resolving
// See: https://stackoverflow.com/a/50451612/938236
var done = (function wait () { if (!done) setTimeout(wait, 1000) })();
if (args.m) {

(async () => {
  var summary = {}
  var dirs = await getDirectories("./").filter((entry) => isDirectory(entry))
  console.log(dirs)
  for (var dir of dirs) {

    args.routes = ["./" + dir]
    summary[dir] = await main(args)
  }
  //console.log(args)
  if (args.output === "JSON") writeFile("SUMMARY.json", JSON.stringify(summary, null, 2), 'utf8', () => console.log("Summary saved"))
})();


} else {
  main(args)
}

async function main (args) {
  try {
    const options = await clean(args);
    console.log(`Working on "${options.routes.join(', ') || '.'}". It might take a while...`);
    //console.log(existsSync((options.routes[0] || '.') + '/package.json'))
    const licenses = existsSync((options.routes[0] || '.') + '/package.json') ? await legally(options) : await pScan(options.routes[0] || '.') //index.js
    //console.log('lic', licenses)
    return await analysis(licenses, options);
    }
   catch(error) {
    console.error(error, args);
    throw error;
  } finally {
    done = true;
  }
};
