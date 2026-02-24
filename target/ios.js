const fs = require('bare-fs')
const path = require('bare-path')
const dir = require('bare-storage')

const storage = path.join(dir.persistent(), 'BareZork')

if (!fs.existsSync(storage)) {
  fs.mkdirSync(storage, { recursive: true })
}

module.exports = { storage, port: 8080, isIOS: true }
