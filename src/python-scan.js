const {walk, read} = require('fs-array');
const searchText = require('./search_text')
const {spawnSync, spawn, exec} = require('child_process')
const isMetadata = /(\/|\\)METADATA$/;

module.exports = (root = '.') => { 
        var pip = spawnSync('python3', ['-m', 'venv', root + '/tempvenv'])
        var activate =  exec('source ' + root + '/tempvenv/bin/activate', (err, stdout, stderr) => {
            if (!err) stdout.pipe(spawn('pip', ['install', '-r', root + '/requirements.txt' ].stdin))
            console.log(stdout.toString())
        })

        return walk(root + '/venvTest2/lib/python3.7/site-packages')
        .filter(pkg => isMetadata.test(pkg))
        .map(async pkg => {
        var pack = pkg.split('/')
        pack = pack[pack.length - 2].replace(".dist-info", "")
        pack = pack.split('-')
        ver = pack[1]
        var name = pack[0]
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