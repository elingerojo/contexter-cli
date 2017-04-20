const fs              = require('fs-extra')
const path     = require('upath')
const inflect  = require('inflection').inflect
const app      = require('./app')
const log      = require('./log')

var compiler = module.exports = {}

compiler.start = (sourceDir, targetFile) => {

  app(sourceDir)
    .on('started', () => {
      log(`Juicing ${path.basename(sourceDir)}...`)
    })
    .on('file-add', (file) => {
      log(`  ${file.path.relative} added`, 'dim')
    })
    .on('squeezing', (files) => {
      process.stdout.write('.')
//      log(`Squeezing ${files.length} ${inflect('file', files.length)}...`)
    })
    .on('squeezed', (context) => {
      if (targetFile) {
        fs.open(targetFile, 'w', (err, fd) => {
          if (err) throw err

          fs.write(fd, JSON.stringify(context), err => {
            if (err) throw err

            log(`Et Voila!`)
            process.exit()
          })

        })
      } else {
        console.log(`\n${JSON.stringify(context)}`)
      }
    })
}
