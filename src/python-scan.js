const {walk, read} = require('fs-array');
const searchText = require('./search_text')
const {spawnSync} = require('child_process')
const isMetadata = /(\/|\\)METADATA$/;

module.exports = (root = '.') => { 
        console.log("Installing Python packages to " + root)
        spawnSync('python3', ['-m', 'venv', root + '/tempvenv'])
        var install = spawnSync(root + '/tempvenv/bin/pip', ['install', '-r', root + '/requirements.txt'])
        console.log(install.output.toString())
        return walk(root + '/tempvenv/lib/python3.7/site-packages')
        .filter(pkg => isMetadata.test(pkg))
        .map(async pkg => {
        var pack = pkg.split('/')
        pack = pack[pack.length - 2].replace(".dist-info", "")
        pack = pack.split('-')
        ver = pack[1]
        var name = pack[0]
        console.log(pkg)
        return {
            name: name + '@' + ver,
            package: await searchText(await read(pkg)),
            copying: [],
            readme: []
          }
       })
       .reduce((obj, { name, ...one }) => ({ ...obj, [name]: one }), {})
    };

    //console.log(res)