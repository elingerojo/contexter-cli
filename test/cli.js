/* globals describe, it, beforeEach, afterEach */

const nixt      = require('nixt')
const exists    = require('path-exists').sync
const expect    = require('chai').expect
const fs        = require('fs-extra')
const pkg       = require('../package.json')

describe('app CLI', function () {
  this.timeout(60000)

  it("outputs usage if run without a command", function(done) {
    nixt()
      .run('node cli.js')
      .stdout(/Serve the current directory/i)
      .stdout(/Serve a specific directory/i)
      .end(done)
  })

  it("outputs package version if -v flag is passed", function(done) {
    nixt()
      .run('node cli.js -v')
      .stdout(pkg.version)
      .end(done)
  })

  describe('build', function(){

    beforeEach(function(){
      fs.removeSync('./test/data.json')
    })

    afterEach(function(){
      fs.removeSync('./test/data.json')
    })

    it("write context in the target file", function(done) {
      nixt()
        .run('node cli.js write test/fixtures test/data.json')
        .end(function(){
          expect(exists('./test/fixtures/index.md')).to.equal(true)
          expect(exists('./test/data.json')).to.equal(true)
          done()
        })
    })

  })

})
