/* globals before, describe, it */

const expect      = require('chai').expect
const fs          = require('fs-extra')
const path        = require('upath')
const supertest   = require('supertest')
const server      = require('../lib/server')

describe('server', function () {
  this.timeout(10000)

  before(function(done){
    server.start(path.resolve(__dirname, 'fixtures'), done)
  })

  describe('GET /api', function(){
    var context

    before(done => {
      supertest(server)
        .get('/api')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          context = res.body
          return done()
        })
    })

    it('responds with an object array of file objects', function(){
      expect(context).to.be.an('object')
      expect(context.datafiles).to.exist
      expect(context.images).to.exist
      expect(context.unknowns).to.exist
    })
  })

  describe('GET /api - get details of a datafile', function(){
    var context
    var headers

    before(done => {
      supertest(server)
        .get('/api')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          context = res.body
          headers = res.headers
          return done()
        })
    })

    it('responds with a specific file object', function(){
      var datafilesArray = context.datafiles
      var datafile = datafilesArray.find(file =>
        file.path.relative === '/redirects.json'
      )
//      expect(datafile.path.relative).to.equal('/redirects.json')
      expect(datafile.data['/apples-of-yore']).to.equal('/apples')
    })

    it('returns a JSON mime type', function(){
      expect(headers['content-type']).to.equal('application/json; charset=utf-8')
    })

  })

  // Steps to test refresh datafile in page object
  // (server is running so squeezing files happens immediately after updating them)
  // Inquire 'page' object to obtain actual data and save as 'original'
  // Update 'always-changing-data.json' file with different data
  // Cycle inquiring 'page' object until 'squeezed' to obtain updated data as 'updated'
  // Assert that they are different
  describe('Refresh datafile in page object', function(){
    const DATAFILE_HREF = '/always-changing-data.json'
    const DATAFILE_PATH = path.resolve(__dirname, 'fixtures', '.' + DATAFILE_HREF)
    var context
    var datafile
    var original
    var updated

    before(done => {
      supertest(server)
        .get('/api')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          context = res.body
          datafile = context.datafiles.filter(file => file.path.relative === DATAFILE_HREF)[0]
          original = datafile.data.today
          var different = original === 'sunny' ? 'rainy' : 'sunny'
          fs.writeJsonSync(DATAFILE_PATH, {today: different})
          return done()
        })
    })

    it('got valid original data', function(){
      expect(['sunny', 'rainy']).to.include(original)
    })

    describe('GET data from updated (and squeezed) datafile', function(){

      // Polls `datafile.squeezed` every 1s
      var check = function(done) {
        supertest(server)
          .get('/api')
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .end((err, res) => {
            context = res.body
            datafile = context.datafiles.filter(file => file.path.relative === DATAFILE_HREF)[0]
            if (datafile.squeezed) {
              // Keep the 'squeezed' flag false to avoid any race condition
              datafile.squeezed = false
              done()
            }
            else setTimeout( function(){ check(done) }, 1000 );
          })
      }

      before(function( done ){
        check( done );
      });

      it('got valid updated data (and different than the original)', function(){
        updated = datafile.data.today
        // Reset file to default value before expectations
        // ...to prevent any test failure case
        fs.writeJsonSync(DATAFILE_PATH, {today: "rainy"})
        expect(['sunny', 'rainy']).to.include(updated)
        expect(updated).to.not.equal(original)
      })
    })

  })

})
