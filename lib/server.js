#!/usr/bin/env node

const express  = require('express')
const cors     = require('cors')
const morgan   = require('morgan')
const path     = require('upath')
const inflect  = require('inflection').inflect
const env      = require('lil-env-thing')
const app      = require('./app')
const log      = require('./log')

var server = module.exports = express()
server.use(cors())

if (env.production) server.use(morgan('combined'))
if (!env.production && !env.test) server.use(morgan('dev'))

server.start = (sourceDir, cb) => {
  if (!sourceDir) sourceDir = process.cwd()
  sourceDir = path.normalize(sourceDir)

  server.port = Number(process.env.CONTEXTER_PORT) || 3000
  server.sourceDir = sourceDir

  var connections = require('./routes')(server)

  app(server.sourceDir)
    .on('started', () => {
      log(`Started contexting ${path.basename(server.sourceDir)}...`)
    })
    .on('squeezing', (files) => {
      process.stdout.write('.')
//      log(`Squeezing ${files.length} ${inflect('file', files.length)}...`)
    })
    .on('squeezed', (context) => {
      if (server.started) return
      server.context = context
      server.listen(server.port, function (err) {
        if (err) throw (err)
        server.started = true
        server.url = `http://localhost:${server.port}`
        log(`done!\nThe server now is running at ${server.url}\n`)
        if (cb) return cb(null)
      })
    })
    .on('file-add',    (file) => askReload(file,'added') )
    .on('file-update', (file) => askReload(file,'updated') )
    .on('file-delete', (file) => askReload(file,'deleted') )

    function askReload(file, fileAction){
      log(`  ${file.path.relative} ${fileAction}`, 'dim')
      if (!server.started) return
      connections.forEach((con, idx) => {
        // `index` and `fileAction` are only for debugging
        con.sseSend({action:'reload', index:idx, fileAction})
      })
    }

}
