import LRCParser from './parser/LRCParser.js'
import NRCParser from './parser/NRCParser.js'
import QRCParser from './parser/QRCParser.js'
import LMLRCParser from './parser/LMLRCParser.js'

const LMLRC = {
  LRCParser,
  NRCParser,
  QRCParser,
  LMLRCParser
}

Object.assign(globalThis, { LMLRC })

export default LMLRC
