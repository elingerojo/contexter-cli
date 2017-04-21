#!/usr/bin/env node

const path            = require('upath')
const tmp             = require('tmp')
const open            = require('open')
const chalk           = require('chalk')
const pkg             = require('./package.json')
const server          = require('./lib/server')
const compiler        = require('./lib/compiler')
const args            = require('minimist')(process.argv.slice(2))
const command         = args._[0]

if (args.v || args.version) version()
if (!command) usage()

if (args._[1]) var sourceDir = path.resolve(process.cwd(), args._[1])
if (args._[2]) var targetFile = path.resolve(process.cwd(), args._[2])
process.env.CONTEXTER_PORT = args.port || args.p || 3000
process.env.CONTEXTER_IGNORES = args.ingores || args.i || './ignores'

switch(command) {
  case 'sers':
  case 'serve':
  case 'server':
  case 'servez':
  case 'servons':
    server.start(sourceDir)
    break
  case 'compile':
  case 'build':
  case 'extract':
  case 'write':
    compiler.start(sourceDir, targetFile)
    break
  case 'help':
  case 'docs':
    open('https://www.npmjs.com/package/contexter-cli')
    break
  default:
    console.log(`Unrecognized command: ${command}\n`)
    usage()
}

function usage() {
  console.log(
`
  contexter serve                             Serve the current directory
  contexter serve <source-dir>                Serve a specific directory
  contexter serve <source-dir> --port 1337    Use a custom port. Default is 3000
  contexter write <source-dir> <target-file>  Write source directory to file
  contexter write <source-dir>                Write source directory to stdout
  contexter help                              Open npm README in your browser
`)

  console.log(chalk.dim(`  version ${pkg.version}`))
  process.exit()
}

function version() {
  console.log(pkg.version)
  process.exit()
}
