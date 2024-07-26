import LMLRC from 'https://cdn.statically.io/gh/Try-To-Create/lmlrc/dist/index.js'

// Obtain parser classes.
const { LRCParser, NRCParser, QRCParser, LMLRCParser } = LMLRC

// Get text and translation.
const text = await fetch('https://cdn.statically.io/gh/Try-To-Create/lmlrc/main/lyrics/磨瀬_初音未来 (初音ミク) - icicles._text.lmlrc').then((response) => response.text())
const translation = await fetch('https://cdn.statically.io/gh/Try-To-Create/lmlrc/main/lyrics/磨瀬_初音未来 (初音ミク) - icicles._translation.lmlrc').then((response) => response.text())

// Define parsers.
const lrcParser = new LRCParser
const nrcParser = new NRCParser
const qrcParser = new QRCParser
const lmlrcParser = new LMLRCParser

// Read the translation text to obtain translation info.
lmlrcParser.set('text', translation)
const translationInfo = lmlrcParser.read()

// Read the text to obtain info.
lmlrcParser.set('text', text)
lmlrcParser.read()

// Bind translation info to info.
lmlrcParser.bindTranslation(translationInfo)

// Log lyric info on the console.
const info = lmlrcParser.get('info')
console.log('Lyric info:\n', info)

// Write NRC (LMLRC enhanced) format lyric text.
lrcParser.set('info', info)
const lrcText = lrcParser.write()
console.log('LRC (LMLRC enhanced) format lyric text:\n', lrcText)

// Write NRC (LMLRC enhanced) format lyric text.
nrcParser.set('info', info)
const nrcText = nrcParser.write()
console.log('NRC (LMLRC enhanced) format lyric text:\n', nrcText)

// Write QRC (LMLRC enhanced) format lyric text.
qrcParser.set('info', info)
const qrcText = qrcParser.write()
console.log('QRC (LMLRC enhanced) format lyric text:\n', qrcText)

// Write LMLRC format lyric text.
lmlrcParser.set('info', info)
const lmlrcText = lmlrcParser.write()
console.log('LMLRC format lyric text:\n', lmlrcText)
