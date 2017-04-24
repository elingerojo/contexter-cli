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

  describe('write', function(){

    beforeEach(function(){
      fs.removeSync('./test/data.json')
    })

    afterEach(function(){
      fs.removeSync('./test/data.json')
    })

    it("writes context in the target file", function(done) {
      nixt()
        .run('node cli.js write test/fixtures test/data.json')
        .end(function(){
          expect(exists('./test/fixtures/index.md')).to.equal(true)
          expect(exists('./test/data.json')).to.equal(true)
          done()
        })
    })

  })

  describe('optional parameter --ignore <ignore-subdir>', function(){

    beforeEach(function(){
      fs.removeSync('./test/data.json')
    })

    afterEach(function(){
      fs.removeSync('./test/data.json')
    })

    it("does ignore a subdirectory recursively if present", function(done) {
      nixt()
        .run('node cli.js write test/fixtures test/data.json --ignore ./other')
        .end(function(){
          expect(exists('./test/fixtures/other/nested/delicious_data.json')).to.equal(true)
          expect(exists('./test/data.json')).to.equal(true)

          var content = fs.readFileSync('./test/data.json', 'utf8')

          expect(content).not.contains('nested')
          done()
        })
    })

    it("does NOT ignore a subdirectory if omited", function(done) {
      nixt()
        .run('node cli.js write test/fixtures test/data.json')
        .end(function(){
          expect(exists('./test/fixtures/other/nested/delicious_data.json')).to.equal(true)
          expect(exists('./test/data.json')).to.equal(true)

          var content = fs.readFileSync('./test/data.json', 'utf8')

          expect(content).contains('nested')
          done()
        })
    })

  })

})
