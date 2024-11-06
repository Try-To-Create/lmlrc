import LyricsParser, { type LyricInfo, type LyricsInfoRule } from '../LyricsParser.js'
import LRCParser from './LRCParser.js'

// NRC (LMLRC enhanced) format lyric parser.
export type NRCType = 'json'

// NRC (LMLRC enhanced) format info (old version).
interface NRCInfo {
  // Unknown attributes.
  sgc?: boolean
  sfy?: boolean
  qfy?: boolean
  klyric?: {
    version?: number
    lyric?: string
  }
  // Lyric text author.
  lyricUser?: {
    nickname?: string
  }
  // Lyric translation author.
  transUser?: {
    nickname?: string
  }
}

// NRC (LMLRC enhanced) format info.
interface NRCInfo {
  // Request status code?
  code?: number
  // Default to false?
  canUploadLyric?: boolean
  // Default to false?
  canUploadTranslation?: boolean
  // Default to false?
  askForTranslation?: boolean
  // Always is false in LMLRC.
  noLyric?: false
  // Lyric text.
  lrc?: {
    version?: number
    lyric?: string
  }
  // Lyric translation.
  tlyric?: {
    version?: number
    lyric?: string
  }
  // Lyric text author.
  lyricContributor?: {
    nickname?: string
    uptime?: number
  },
  // Lyric translation author.
  translationContributor?: {
    nickname?: string
    uptime?: number
  }
}

// NRC (LMLRC enhanced) format lyric parser.
export default class NRCParser extends LyricsParser<NRCType> {
  readonly version: string = '1.0.0'

  readonly author: string = 'PlayDrinkEatCode'

  protected type: NRCType = 'json'

  protected setNoteRules(): RegExp[] {
    return (new LRCParser).get('noteRules')
  }

  protected setInfoRules(): LyricsInfoRule[] {
    return (new LRCParser).get('infoRules')
  }

  protected readPreprocess(text: string): string[] {
    const nrcInfo: NRCInfo = JSON.parse(text)
    const { lrc, lyricUser, lyricContributor,
      tlyric, transUser, translationContributor } = nrcInfo
    const { info } = this
    if (lrc) {
      if (lrc.version) {
        info.version = lrc.version.toString()
      }
      text = lrc.lyric || ''
    }
    const author = lyricUser || lyricContributor
    if (author?.nickname) {
      info.author = author.nickname
    }
    if (tlyric) {
      if (tlyric.version) {
        info.translationVersion = tlyric.version.toString()
      }
      if (tlyric.lyric) {
        const { extraInfo } = this
        extraInfo.translation = new LRCParser({ text: tlyric.lyric }).read()
      }
    }
    const translationAuthor = transUser || translationContributor
    if (translationAuthor?.nickname) {
      info.translationAuthor = translationAuthor.nickname
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

  // Compile to json format.
  protected complieToJSON(text: string, translation?: string): string {
    const { info } = this
    const { author, version,
      translationAuthor, translationVersion } = info
    const nrcInfo: NRCInfo = {
      code: 200,
      sgc: false,
      sfy: false,
      qfy: false,
      klyric: {
        version: 0,
        lyric: ''
      },
      lrc: {
        version: parseInt(version || '1'),
        lyric: text
      }
    }
    if (author) {
      nrcInfo.lyricUser = {
        nickname: author
      }
      nrcInfo.lyricContributor = {
        nickname: author
      }
    }
    if (translation) {
      nrcInfo.tlyric = {
        version: parseInt(translationVersion || '1'),
        lyric: translation
      }
      if (translationAuthor) {
        nrcInfo.transUser = {
          nickname: translationAuthor
        }
        nrcInfo.translationContributor = {
          nickname: translationAuthor
        }
      }
    }
    return JSON.stringify(nrcInfo)
  }

  protected compile(info: LyricInfo): void {
    const { title, artist, album, offset, lines } = info
    const textInfo: LyricInfo = { title, artist, album, offset }
    const translationInfo: LyricInfo = {}
    if (lines) {
      textInfo.lines = []
      translationInfo.lines = []
      for (const line of lines) {
        textInfo.lines.push({ start: line.start, text: line.text })
        translationInfo.lines.push({ start: line.start, text: line.translation })
      }
    }
    const text = new LRCParser({ info: textInfo }).write()
    const translation = new LRCParser({ info: translationInfo }).write()
    this.text = this.complieToJSON(text, translation || undefined)
  }
}
