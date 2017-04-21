'use strict'

const fs              = require('fs-extra')
const path            = require('upath')
const getImageColors  = require('get-image-colors')
const exif            = require('exif-parser')
const imageSize       = require('image-size')
const pluralize       = require('inflection').pluralize
const tmp             = require('tmp')

module.exports = {
  read () {
    // No-op. `Image` class does not read files directly.
    // This function placeholder needs to be here to override `File` class read ()
  },

  // Overrides `File` class default `parseCallback` method. No output needed
  parseCallback (err) {
    if (err) throw err
  },

  setDimensions () {
    try {
      this.dimensions = imageSize(this.path.processRelative)
    } catch (e) {
      throw e
    }
  },

  setExif () {
    if (!this.isJPEG()) return
    this.exif = exif.create(fs.readFileSync(this.path.processRelative)).parse()
  },

  setColors () {
    var self = this
    getImageColors(this.path.processRelative, function(err, colors){
      if (err) throw err
      self.colors = colors.map(color => color.hex())

      self.squeezed = true
    })
  },

  isJPEG () {
    var ext = this.path.ext.toLowerCase()
    return ext === '.jpg' || ext === '.jpeg'
  },
/*
  keyName () {
    return this.path.relative
  }
*/
}
