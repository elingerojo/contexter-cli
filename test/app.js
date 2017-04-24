/* globals describe, it */

const path      = require('upath')
const expect    = require('chai').expect
const tmp       = require('tmp')
const uniq      = require('lodash').uniq
const exists    = require('path-exists').sync
const app       = require('../lib/app')
const they      = it
const test      = it

const sourceDir = path.join(__dirname, 'fixtures')
var context

describe('app', function () {
  this.timeout(10000)

  process.env.CONTEXTER_IGNORES = 'node_modules'

  it('is a function', function () {
    expect(app).to.be.a('function')
  })

  it("emits a series of lifecycle events, ultimately emitting a squeezed context object", function (done) {
    var events = []

    app(sourceDir)
      .on('started', () => events.push('started'))
      .on('squeezing', () => events.push('squeezing'))
      .on('squeezed', (_context) => {
        expect(uniq(events)).to.deep.equal(['started', 'squeezing'])
        context = _context
        done()
      })
  })

  describe('context', function() {

    it('is an object returned by the `squeezed` event', function () {
      expect(context).to.exist
      expect(context).to.be.an('object')
    })

    it('has an array for each primitive: datafiles, images and unknowns', function(){
      expect(context.datafiles).to.be.an('array')
      expect(context.images).to.be.an('array')
      expect(context.unknowns).to.be.an('array')
    })
  })

  describe('datafiles', function() {
    var datafiles

    before(function(){
      datafiles = context.datafiles
    })

    they('are in an array', function () {
      expect(datafiles).to.be.an('array')
    })

    describe('path', function() {
      it('is an object with a bunch of sliced and diced info about the filename', function(){
        expect(datafiles['/redirects.json'].path.full).to.include('/test/fixtures/redirects.json')
        expect(datafiles['/redirects.json'].path.relative).to.equal('/redirects.json')
        expect(datafiles['/redirects.json'].path.processRelative).to.equal('test/fixtures/redirects.json')
        expect(datafiles['/redirects.json'].path.root).to.equal('/')
        expect(datafiles['/redirects.json'].path.dir).to.equal('/')
        expect(datafiles['/redirects.json'].path.base).to.equal('redirects.json')
        expect(datafiles['/redirects.json'].path.ext).to.equal('.json')
        expect(datafiles['/redirects.json'].path.name).to.equal('redirects')

      })

    })
  })

  describe('unknowns', function () {
    var unknowns
    var filenames

    before(function(){
      unknowns = context.unknowns
      filenames = unknowns.map(f => f.path.relative)
    })

    they('do NOT include extensionless files like CNAME', function(){
      expect(filenames).to.not.contain('/CNAME')
    })

    they('do NOT include zip files', function(){
      expect(filenames).to.not.contain('/archive.zip')
    })

    they('include font files with extension like images (.svg)', function(){
      expect(filenames).to.contain('/fonts/glyphicons-halflings-regular.svg')
    })
  })

  describe('images', function(){
    var images
    var filenames

    before(function(){
      images = context.images
      filenames = images.map(f => f.path.relative)
    })

    they('include width and height dimensions', function() {
      const jpg = images['/thumbs/jpg/thumb.jpg']
      expect(jpg.dimensions.width).to.equal(170)
      expect(jpg.dimensions.height).to.equal(170)
    })

    they('include exif data', function(){
      const jpg = images['/thumbs/jpg/thumb.jpg']
      expect(jpg.exif.imageSize.width).to.equal(170)
      expect(jpg.exif.imageSize.height).to.equal(170)
    })

    they('include color data as hex strings', function() {
      var colors = images['/thumbs/gif/thumb.gif'].colors
      expect(colors).to.be.an('array')
      expect(colors[0]).to.match(/^#[0-9a-f]{3,6}$/i)
    })

    they('do not include font files with extension like images (.svg)', function(){
      expect(filenames).to.not.contain('/fonts/glyphicons-halflings-regular.svg')
    })
  })

  describe('datafiles', function() {

    they("get a deep named key propertiy's path to data ", function() {
      var file = __dirname + '/fixtures/other/nested/delicious_data.json'
      expect(exists(file)).to.be.true

      expect(context.datafiles).to.be.an('array')
      expect(context.datafiles['/other/nested/delicious_data.json'].data).to.be.an('object')
      expect(context.datafiles['/other/nested/delicious_data.json'].data.delicious).to.equal(true)
      expect(context.datafiles['/other/nested/delicious_data.json'].data.deliciousness).to.equal(9)
    })

  })

})
