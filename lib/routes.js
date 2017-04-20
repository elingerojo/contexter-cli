const log      = require('./log')
const get      = require('lodash').get
const fs       = require('fs')
const path     = require('upath')

module.exports = function(server) {
  const dir = path.relative(process.cwd(), __dirname)
  const error404filename = 'app-server-404.html'
  const error404fullpath = path.resolve(dir, 'fixtures', error404filename)
  const homepageFullpath = path.resolve(dir, '../website', 'index.html')

  var  error404 = fs.readFileSync(error404fullpath, 'utf8')
  var  homepage = fs.readFileSync(homepageFullpath, 'utf8')

  // Show context as json
  server.get('/api', (req, res) => {
    res.json(server.context)
  })

  // TODO: Improve API navigation (this only works for first level properties)
  // Show just first level context property
  server.get('/api/*', (req, res) => {
    var key = req.params[0]
    var response = server.context[key]
    if (req.query.key) response = get(response, req.query.key)

    res.json(response)
  })

  // Get `index.html` homepage
  server.get('/', (req, res) => {
    return res.send(homepage)
  })

  // Arbitrary filename selected to hold context object from server to browser
  server.get('/dirData.js', (req, res) => {
    res.json(server.context)
  })

  // Get files requested by `index.html` like images, stylesheets and scripts
  server.get('*', (req, res) => {
    var href = req.path.replace(/\/$/, '') // remove trailing slash
    server.respondWithFile(href, req, res)
  })

  server.respondWithFile = (href, req, res) => {
    var context = server.context

    href = href.slice(1) // Remove leading slash

    // Only look for files in `website` directory
    var hrefFullpath = path.resolve(dir, '../website', href)

    if (fs.existsSync(hrefFullpath)) {
      return res.sendFile(hrefFullpath)
    } else {
      return res.status(404).send(error404.replace('_href-placeholder_', href))
    }

  }

}
