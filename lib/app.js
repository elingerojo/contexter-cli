'use strict'

const ee              = require('event-emitter')
const exists          = require('path-exists').sync
const files           = require('require-dir')('./files')
const fs              = require('fs')
const path            = require('upath')
const plugins         = require('require-dir')('./plugins')
const tmp             = require('tmp')
const Contexter       = require('contexter')

module.exports = function app (sourceDir) {
  sourceDir = sourceDir || path.normalize(process.cwd())

  const emitter = ee()
  const configs = {
    // Report remaining files every half second while contexting
    reportInterval: 500,
    // Set file watch mode (either watch all files or just plugin extensions)
    isWatchAll: (process.env.CONTEXTER_WATCH_ALL || false),
    // Change context `root` property from default '/' to last directory in path
    pluginConfig: {'root': sourceDir.substring(sourceDir.lastIndexOf('/') + 1)}
  }
  const ctxr = new Contexter(configs)

  // ".extend()" the basic Contexter file type(s) with app's file types
  Object.keys(files).forEach(type => {
    // `.extend(name-of-type, file-type-object)`
    ctxr.extend(type, files[type])
  })

  // Set ".use()" plugins in `priority` order
  Object.keys(plugins).sort((a, b) => {
    return plugins[a].priority || 0 - plugins[b].priority || 0
  }).forEach(plugin => ctxr.use(plugins[plugin]))

  // Initialize `ignores` array with pattern for files or dirs that begin with a dot
  var ignores = [ /(^|[\/\\])\../ ]
  // ... add ignore directory in CLI argument `--ignore <ignore-dir>`
  var customIgnores = path.join(sourceDir, process.env.CONTEXTER_IGNORES)
  ignores = ignores.concat(customIgnores)

  // All of the above have to be synchronous
  // ... we do not want watcher to start without all file type handlers loaded
  ctxr.watcher(sourceDir, {ignored: ignores})
    .on('adding', file => emitter.emit('file-add', file))
    .on('updating', file => emitter.emit('file-update', file))
    .on('deleting', file => emitter.emit('file-delete', file))
    .on('contexting', files => emitter.emit('squeezing', files))
    .on('ready', ctx => emitter.emit('squeezed', ctx))

  process.nextTick(function() {
    emitter.emit('started')
  })

  return emitter
}
