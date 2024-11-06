// Lyric font.
export interface LyricFont {
  start?: number
  duration?: number
  length: number
}

// Lyric line.
export interface LyricLine {
  start?: number
  end?: number
  text?: string
  translation?: string
  fonts?: LyricFont[]
}

// Lyric info.
export interface LyricInfo {
  title?: string
  artist?: string
  album?: string
  author?: string
  translationAuthor?: string
  version?: string
  translationVersion?: string
  offset?: number
  lines?: LyricLine[]
}

// Lyric extra info.
export interface LyricExtraInfo {
  [key: string]: string | number | boolean | LyricInfo
}

// Constructor options for lyrics parsers.
export interface LyricsParserOptions<TYPE> {
  type?: TYPE
  text?: string
  info?: LyricInfo
  extraInfo?: LyricExtraInfo
}

// Lyrics parser status code.
export enum LyricsParserState {
  Created,
  GettedText,
  GettedInfo
}

// Lyrics info read rule.
export interface LyricsInfoRule {
  name: keyof LyricInfo
  regexp: RegExp
  method?: (matched: RegExpMatchArray, info: LyricInfo) => any
}

// Lyrics read rules.
export interface LyricsRules {
  note: RegExp[],
  info: LyricsInfoRule[]
}

// Abstract class for lyrics parsers.
export default abstract class LyricsParser<TYPE extends string> {
  // Lyrics parser version.
  abstract readonly version: string

  // Lyrics parser author.
  abstract readonly author: string

  // Lyrics parser process type.
  protected abstract type: TYPE

  // Lyrics parser status code. Default to LyricsParserState.Created.
  protected state: LyricsParserState = LyricsParserState.Created

  // Lyrics parser error. Default to a new Error with message of ''.
  protected error: Error = new Error

  // Lyric text. Default to ''.
  protected text: string = ''

  // Lyric info. Default to {}.
  protected info: LyricInfo = {}

  // Lyric extra info. Default is {}.
  protected extraInfo: LyricExtraInfo = {}

  // Lyrics read rules.
  protected rules: LyricsRules = {
    note: [],
    info: []
  }

  // Set error message for lyrics parser.
  protected setError(error: string): void {
    this.error.message = error
  }

  // Getter for lyrics parser.
  get(name: 'type'): TYPE
  get(name: 'state'): LyricsParserState
  get(name: 'error'): string
  get(name: 'text'): string
  get(name: 'info'): LyricInfo
  get(name: 'extraInfo'): LyricExtraInfo
  get(name: 'noteRules'): RegExp[]
  get(name: 'infoRules'): LyricsInfoRule[]
  get(name: 'type' | 'state' | 'error' | 'text' | 'info' | 'extraInfo' | 'noteRules' | 'infoRules') {
    if (name == 'error') {
      return this[name].message
    }
    if (name == 'noteRules') {
      return this.rules.note
    }
    if (name == 'infoRules') {
      return this.rules.info
    }
    return this[name]
  }

  // Setter for lyrics parser.
  set(name: 'type', value: TYPE): void
  set(name: 'text', value: string): void
  set(name: 'info', value: LyricInfo): void
  set(name: 'extraInfo', value: LyricExtraInfo): void
  set(name: 'type' | 'text' | 'info' | 'extraInfo', value: TYPE | string | LyricInfo | LyricExtraInfo) {
    switch (name) {
      case 'type':
        this[name] = value as TYPE
        break
      case 'text':
        this.text = value as string
        this.state = LyricsParserState.GettedText
        break
      case 'info':
        this.info = value as LyricInfo
        this.state = LyricsParserState.GettedInfo
        break
      case 'extraInfo':
        this.extraInfo = value as LyricExtraInfo
        break
    }
  }

  // Add info read rule for lyrics parser.
  protected addInfoRule({ name, regexp, method }: LyricsInfoRule): void {
    if (!method) {
      method = (matched) => {
        if (name == 'offset') {
          return + matched[1]
        }
        return matched[1]
      }
    }
    this.rules.info.push({ name, regexp, method })
  }

  // Set note read rules for lyrics parser.
  protected abstract setNoteRules(): RegExp[]

  // Set info read rules for lyrics parser.
  protected abstract setInfoRules(): LyricsInfoRule[]

  // Add read rules for lyrics parser.
  protected addRules(): void {
    this.rules.note = this.setNoteRules()
    const infoRules: LyricsInfoRule[] = this.setInfoRules()
    for (const infoRule of infoRules) {
      this.addInfoRule(infoRule)
    }
  }

  // Initialization for read.
  protected readInit(): void {
    this.info = {}
    this.extraInfo = {}
  }

  // Remove all notes by note read rules.
  protected removeNotes(text: string): string {
    for (const regexp of this.rules.note) {
      const matched = text.match(regexp)
      if (matched) {
        for (const note of matched) {
          text = text.replace(note, '')
        }
      }
    }
    return text
  }

  // Remove blank lyric lines.
  protected removeBlankLines(lines: string[]): void
  protected removeBlankLines(lines: LyricLine[]): void
  protected removeBlankLines(lines: string[] | LyricLine[]) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const text: string = typeof line == 'string' ? line : line.text || ''
      if (!text.trim()) {
        lines.splice(i--, 1)
      }
    }
  }

  // Split lyric text to lines.
  protected splitToLines(text: string): string[] {
    const lines = text.split('\n')
    lines.forEach((value, index) => {
      lines[index] = value.trim()
    })
    this.removeBlankLines(lines)
    return lines
  }

  // Preprocess for read.
  protected readPreprocess(text: string): string[] {
    text = this.removeNotes(text)
    return this.splitToLines(text)
  }

  // Read lyric text line by info read rules.
  protected readLine(line: string): void {
    for (const rule of this.rules.info) {
      const { name, regexp, method } = rule
      // Try to match rule.
      const matched = line.match(regexp)
      // Execute the method when the match is successful.
      if (matched && method) {
        const result = method(matched, this.info)
        this.info[name] = result
      }
    }
  }

  // Post process for read.
  protected readPostProcess(): void {
    const { lines } = this.info
    if (lines) {
      this.removeBlankLines(lines)
    }
  }

  // Read process.
  protected readProcess(): void {
    this.readInit()
    const lines: string[] = this.readPreprocess(this.text)
    for (const line of lines) {
      this.readLine(line)
    }
    this.readPostProcess()
    this.state = LyricsParserState.GettedInfo
  }

  // Read lyric text to get lyric info.
  read(): LyricInfo {
    switch (this.state) {
      case LyricsParserState.Created:
        this.setError('Please set text.')
        throw this.error
      case LyricsParserState.GettedText:
        this.readProcess()
        break
    }
    return this.info
  }

  // Initialization for write.
  protected writeInit(): void {
    this.text = ''
  }

  // Preprocess for write.
  protected writePreprocess(info: LyricInfo): void {
    if (info.lines) {
      this.removeBlankLines(info.lines)
    }
  }

  // Write text to lyric text.
  protected writeText(text: string): void {
    this.text += text
  }

  // Add line feed.
  protected addLineFeed(): void {
    if (this.text) {
      this.writeText('\n')
    }
  }

  // Write text with line breaks to lyric text.
  protected writeLine(text: string): void {
    this.addLineFeed()
    this.writeText(text)
  }

  // Pad string to start to target length.
  protected padStart(text: string, targetLength: number, padString: string): string {
    while (text.length < targetLength) {
      const missingLength = targetLength - text.length
      const length = padString.length < missingLength ? padString.length : missingLength
      text = padString.substring(0, length) + text
    }
    return text
  }

  // Pad string to a int number start to get a string with target length.
  protected padStartInt(number: number, length: number): string {
    let numberString = number.toString()
    number = parseInt(numberString)
    numberString = number.toString()
    numberString = this.padStart(numberString, length, '0')
    return numberString
  }

  // Write lyric text.
  protected abstract compile(info: LyricInfo): void

  // Write process.
  protected writeProcess() {
    this.writeInit()
    this.writePreprocess(this.info)
    this.compile(this.info)
    this.state = LyricsParserState.GettedText
  }

  // Read lyric info to get lyric text.
  write(): string {
    switch (this.state) {
      case LyricsParserState.Created:
        this.setError('Please set info.')
        throw this.error
      case LyricsParserState.GettedInfo:
        this.writeProcess()
        break
    }
    return this.text
  }

  // Add translation to info.
  protected addTranslationToinfo({ start, end, text }: LyricLine) {
    const state: {
      difference: {
        start: number
        end: number
      }
      translation?: string
      line?: LyricLine
    } = {
      difference: {
        start: Infinity,
        end: Infinity
      }
    }
    const { info } = this
    // Get the closest line.
    for (const line of info.lines!) {
      const startDifference = line.start && start ? Math.abs(line.start - start) : Infinity
      const endDifference = line.end && end ? Math.abs(line.end - end) : Infinity
      const { difference } = state
      if (startDifference < difference.start) {
        difference.start = startDifference
        difference.end = endDifference
        state.translation = text
        state.line = line
      } else if (startDifference == difference.start && endDifference < difference.end) {
        difference.end = endDifference
        state.translation = text
        state.line = line
      }
    }
    // Bind translation.
    if (state.line) {
      state.line.translation = state.translation
    }
  }

  // Bind translation.
  bindTranslation({ author, version, lines }: LyricInfo = {}) {
    const { info } = this
    if (author) {
      info.translationAuthor = author
    }
    if (version) {
      info.translationVersion = version
    }
    if (lines) {
      for (const line of lines) {
        this.addTranslationToinfo(line)
      }
    }
  }

  constructor({ type, text, info, extraInfo }: LyricsParserOptions<TYPE> = {}) {
    if (type) {
      this.set('type', type)
    }
    if (text) {
      this.set('text', text)
    }
    if (info) {
      this.set('info', info)
    }
    if (extraInfo) {
      this.set('extraInfo', extraInfo)
    }
    this.addRules()
  }
}
