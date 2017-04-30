const log      = require('./log')
const get      = require('lodash').get
const fs       = require('fs')
const path     = require('upath')
const sse      = require('./sse')

var connections = []
module.exports = function(server) {
  const dir = path.relative(process.cwd(), __dirname)
  const error404filename = 'app-server-404.html'
  const error404fullpath = path.resolve(dir, 'fixtures', error404filename)
  const homepageFullpath = path.resolve(dir, '../website', 'index.html')

  var error404 = fs.readFileSync(error404fullpath, 'utf8')
  var homepage = fs.readFileSync(homepageFullpath, 'utf8')

  // Add SSE middleware
  server.use(sse)

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
    var dirMessage = 'Directory filtered to watch ONLY datafiles and images ...'
    if (process.env.CONTEXTER_WATCH_ALL) dirMessage = 'This directory ...'
    return res.send(homepage.replace('_dirMessage-placeholder_', dirMessage))
  })

  // Arbitrary filename selected to hold context object from server to browser
  server.get('/dirData.js', (req, res) => {
    // TODO: Remove unresponisve connections (unresponsive is when SSE sends...
    // ... a `reload` message and there was no `/dirData.js` request after...
    // ... x seconds for a particular `index` connection)
    res.json(server.context)
  })

  // Arbitrary url to send SSE event with context object from server to browser
  server.get('/events', (req, res) => {
    function sendPing() {
      // `index` and `fileAction` are only for debugging
      res.sseSend({
        action:"ping",
        index:connections.length - 1,
        fileAction: 'none'
      })
    }

    res.sseSetup()
    connections.push(res)
    // TODO: Develop a way to close SSE unresponisve connections
    // 45 sec. Needed to keep same SSE connection
    setInterval(sendPing, 45000)
    sendPing()
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

  return connections

}
