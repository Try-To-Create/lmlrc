import LyricsParser, { type LyricFont, type LyricLine, type LyricInfo, type LyricsInfoRule } from '../LyricsParser.js'
import LRCParser from './LRCParser.js'

// QRC (LMLRC enhanced) format lyric parser.
export type QRCType = 'xml' | 'text'

// QRC (LMLRC enhanced) format lyric parser.
export default class QRCParser extends LyricsParser<QRCType> {
  readonly version: string = '1.0.0'

  readonly author: string = 'PlayDrinkEatCode'

  protected type: QRCType = 'xml'

  protected setNoteRules(): RegExp[] {
    return (new LRCParser).get('noteRules')
  }

  protected setInfoRules(): LyricsInfoRule[] {
    const infoRules = (new LRCParser).get('infoRules')
    infoRules.push({
      name: 'lines',
      regexp: /^\[(\d+),(\d+)\](.*)$/,
      method(matched, info) {
        const [, start, duration, text] = matched
        // Get lyric lines info.
        const lines: LyricInfo['lines'] = info.lines || []
        // Present line. 
        const line: LyricLine = {}
        line.start = +start
        line.end = +start + +duration
        line.fonts = []
        // Set a default value '' for lyric line text.
        line.text = ''
        const regexp = /(.+?)\((\d+),(\d+)\)/g
        // Read the font info of lyric line.
        text.match(regexp)!.forEach((matchedStr) => {
          const matched = matchedStr.match(new RegExp(regexp, 'i'))!
          const [, text, start, duration] = matched
          const font: LyricFont = { start: +start, duration: +duration, length: text.length }
          line.fonts!.push(font)
          line.text += text
        })
        lines.push(line)
        return lines
      }
    })
    return infoRules
  }

  protected readPreprocess(text: string): string[] {
    if (this.type == 'xml') {
      const textMatched = text.match(/LyricContent="([^"]*)"/)
      const translationMatched = text.match(/TranslationContent="([^"]*)"/)
      if (textMatched) {
        text = textMatched[1]
      }
      if (translationMatched) {
        let translation = translationMatched[1]
        while (translation.includes('{')) {
          translation = translation.replace('{', '[')
        }
        while (translation.includes('}')) {
          translation = translation.replace('}', ']')
        }
        const info = (new LRCParser({ text: translation })).read()
        this.extraInfo.translation = info
      }
    }
    return super.readPreprocess(text)
  }

  protected readPostProcess(): void {
    super.readPostProcess()
    const { translation } = this.extraInfo
    if (translation) {
      this.bindTranslation(translation as LyricInfo)
    }
  }

  // Compile to xml format.
  protected compileToXML(text: string, translation?: string): void {
    this.text = ''
    this.writeLine(`<?xml version="1.0" encoding="utf-8"?>`)
    this.writeLine(`<QrcInfos>`)
    // Use the current time as the save time. Version is default to 100?
    this.writeLine(`<QrcHeadInfo SaveTime="${(+(new Date)).toString()}" Version="100"/>`)
    // Lyrics count is default to 1?
    this.writeLine(`<LyricInfo LyricCount="1">`)
    // Lyric type is default to 1?
    this.writeLine(`<Lyric_1 LyricType="1" LyricContent="${text}`)
    // Enhanced ability. Translation format unknown.
    if (translation) {
      this.writeLine(`" TranslationContent="${translation}`)
    }
    this.writeLine(`"/>`)
    this.writeLine(`</LyricInfo>`)
    this.writeLine(`</QrcInfos>`)
  }

  protected compile(info: LyricInfo): void {
    const { title, artist, album,
      author, translationAuthor,
      version, translationVersion,
      offset,
      lines
    } = info
    if (this.type == 'xml') {
      const info: LyricInfo = {
        title, artist, album,
        author, translationAuthor,
        version, translationVersion,
        offset
      }
      const text = new LRCParser({ info }).write()
      this.writeText(text)
      if (lines) {
        const info: LyricInfo = { lines: [] }
        lines.forEach((line, index) => {
          const start: number = line.start || (index ? lines[index - 1].end || lines[index - 1].start || 0 : 0)
          const end: number | undefined = line.end || (index < lines.length - 1 ? lines[index + 1].start : undefined)
          // Lyric line duration. Default to 1000.
          const duration = end ? end - start : 1000
          const { text, translation, fonts } = line
          if (text) {
            this.writeLine(`[${start},${duration}]`)
            if (fonts) {
              let startIndex: number = 0
              fonts.forEach((font, index) => {
                // Lyric font start. Default to lyric line start.
                const fontStart: number = font.start || (index ? fonts[index - 1].start! + fonts[index - 1].duration! : start)
                const nextFont = fonts[index + 1]
                // Lyric font duration. Default to 1000.
                const fontDuration: number = font.duration || (nextFont && nextFont.start ? nextFont.start - fontStart : 1000)
                this.writeText(`${text.substring(startIndex, startIndex + font.length)}(${fontStart},${fontDuration})`)
                startIndex += font.length
              })
            } else {
              this.writeText(`${text}(${start},${duration})`)
            }
          }
          if (translation && info.lines) {
            info.lines.push({ start, text: translation })
          }
        })
        let translation: string = new LRCParser({ info }).write()
        // Prevent errors in QQMusic.
        const translationLines = translation.split('\n')
        translation = ''
        for (const line of translationLines) {
          translation += line.replace('[', '{').replace(']', '}') + '\r\n'
        }
        this.compileToXML(this.text, translation.trim())
      }
    } else {
      const text = new LRCParser({ info }).write()
      this.writeText(text)
    }
  }
}
