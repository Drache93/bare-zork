const { command, header, flag } = require('paparam')
const process = require('bare-process')
const path = require('bare-path')
const dir = require('bare-storage')

const cmd = command(
  'bare-zork',
  header(`Zork everywhere`),
  flag('--storage|-s [storage]', 'Path to storage directory'),
  flag('--port|-p [port]', 'websocket port'),
  flag('--host|-h [host]', 'websocket host'),
  flag('--headless', 'run without views')
)
cmd.parse(process.argv.slice(1))

const storage = cmd.flags.storage || path.join(dir.persistent(), '.BareZork')
const port = cmd.flags.port || 8080
const host = cmd.flags.host
const headless = !!cmd.flags.headless

module.exports = { storage, port, host, headless }
