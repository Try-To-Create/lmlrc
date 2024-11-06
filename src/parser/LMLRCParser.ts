import LyricsParser, { type LyricFont, type LyricLine, type LyricInfo, type LyricsInfoRule } from '../LyricsParser.js'
import LRCParser from './LRCParser.js'

// LMLRC format lyric type.
export type LMLRCType = 'text' | 'json'

// LMLRC format lyric parser.
export default class LMLRCParser extends LyricsParser<LMLRCType> {
    readonly version: string = '1.0.0'

    readonly author: string = 'PlayDrinkEatCode'

    protected type: LMLRCType = 'text'

    protected setNoteRules(): RegExp[] {
        const noteRules = (new LRCParser).get('noteRules')
        // Comment method: # note.
        noteRules.push(/#(.*)/g)
        return noteRules
    }

    protected setInfoRules(): LyricsInfoRule[] {
        const infoRules = (new LRCParser).get('infoRules')
        const extraInfoRules: LyricsInfoRule[] = [
            { name: 'title', regexp: /^\[ti(?:tle)?\](.*)$/ },
            { name: 'artist', regexp: /^\[ar(?:tist)?\](.*)$/ },
            { name: 'album', regexp: /^\[al(?:bum)?\](.*)$/ },
            { name: 'author', regexp: /^\[(?:by|au(?:thor)?)\](.*)$/ },
            { name: 'translationAuthor', regexp: /^\[ta\](.*)$/ },
            { name: 'version', regexp: /^\[ve(?:rsion)?\](.*)$/ },
            { name: 'translationVersion', regexp: /^\[tv\](.*)$/ },
            { name: 'offset', regexp: /^\[offset\](.*)$/ },
            // Line time rule.
            {
                name: 'lines',
                regexp: /^\[(?:(\d+),)?(\d+)?\]/,
                method(matched, info) {
                    // Line start time.
                    const start = matched[1]
                    // Line duration time.
                    const duration = matched[2]
                    // Get lyric lines info.
                    const lines: LyricInfo['lines'] = info.lines || []
                    // Present line. 
                    const line: LyricLine = {}
                    const lastLine: LyricLine | null = lines.length ? lines[lines.length - 1] : null
                    if (start) {
                        // Add line start time for present line.
                        line.start = +start
                        // Add line end time for previous line.
                        if (lastLine && lastLine.end == null) {
                            lastLine.end = +start
                        }
                    } else if (lastLine && lastLine.end != null) {
                        // Add line start time for present line from last line.
                        line.start = lastLine.end
                    } else {
                        // Assume it is the first line. Default is 0.
                        line.start = 0
                    }
                    // Add line end time for present line.
                    if (duration && line.start) {
                        line.end = line.start + +duration
                    }
                    lines.push(line)
                    return lines
                }
            },
            // Line text rule.
            {
                name: 'lines',
                regexp: /((?<![<([{][^>)\]}]*)[^<[{]+(?![>\]}]))/,
                method(matched, info) {
                    const text = matched[1]
                    const { lines } = info
                    if (lines && lines.length) {
                        lines[lines.length - 1].text = text
                    }
                    return lines
                }
            },
            // Line translation rule.
            {
                name: 'lines',
                regexp: /{(.*)}/,
                method(matched, info) {
                    const translation = matched[1]
                    const { lines } = info
                    if (lines && lines.length) {
                        lines[lines.length - 1].translation = translation
                    }
                    return lines
                }
            },
            // Font time rule.
            {
                name: 'lines',
                regexp: /<((?:,?\d+(?:\+\d+)?(?:\/\d+)?)*)>/,
                method(matched, info) {
                    const regexp = /(?:(\d+)\+)?(\d+)(?:\/(\d+))?/g
                    const time = matched[1]
                    time.match(regexp)!.forEach((time) => {
                        const matched = time.match(new RegExp(regexp, 'i'))!
                        const [, start, duration, length] = matched
                        const { lines } = info
                        if (lines && lines.length) {
                            const line = lines[lines.length - 1]
                            const fonts: LyricFont[] = line.fonts = line.fonts || []
                            // Present font.
                            const font: LyricFont = { length: +(length || 1) }
                            const lastFont = fonts.length ? fonts[fonts.length - 1] : null
                            if (start) {
                                font.start = line.start! + +start
                            } else if (lastFont) {
                                font.start = lastFont.start! + lastFont.duration!
                            } else {
                                font.start = line.start
                            }
                            font.duration = +duration
                            fonts.push(font)
                        }
                    })
                    return info.lines
                }
            }
        ]
        Object.assign(infoRules, extraInfoRules)
        return infoRules
    }

    protected readPreprocess(text: string): string[] {
        if (this.type == 'json') {
            Object.assign(this.info, JSON.parse(text))
            text = ''
        }
        return super.readPreprocess(text)
    }

    // Get line time string.
    protected getTimeString(start: number, end?: number, previousLine?: LyricLine): string {
        // Lyric line duration. Default to 1000.
        const duration = end ? end - start : 1000
        // Omit the start time.
        if ((!previousLine && !start) || (previousLine && previousLine.end == start)) {
            return `[${duration}]`
        } else {
            return `[${start},${duration}]`
        }
    }

    protected compile(info: LyricInfo): void {
        if (this.type == 'text') {
            const { title, artist, album,
                author, translationAuthor,
                version, translationVersion,
                offset,
                lines
            } = info
            if (title) {
                this.writeLine(`[ti]${title}`)
            }
            if (artist) {
                this.writeLine(`[ar]${artist}`)
            }
            if (album) {
                this.writeLine(`[al]${album}`)
            }
            if (author) {
                this.writeLine(`[by]${author}`)
            }
            if (translationAuthor) {
                this.writeLine(`[ta]${translationAuthor}`)
            }
            if (version) {
                this.writeLine(`[ve]${version}`)
            }
            if (translationVersion) {
                this.writeLine(`[tv]${translationVersion}`)
            }
            if (offset) {
                this.writeLine(`[offset]${offset}`)
            }
            if (lines) {
                lines.forEach((line, index) => {
                    const start: number = line.start || (index > 0 ? lines[index - 1].end || lines[index - 1].start || 0 : 0)
                    const end: number | undefined = line.end || (index < lines.length - 1 ? lines[index + 1].start : undefined)
                    const { text, translation, fonts } = line
                    if (text) {
                        this.writeLine(`${this.getTimeString(start, end, lines[index - 1])}${text}`)
                    }
                    if (translation) {
                        this.writeText(`{${translation}}`)
                    }
                    if (fonts) {
                        this.writeText('<')
                        fonts.forEach((font, index) => {
                            const fontStart: number = font.start || (index ? fonts[index - 1].start! + fonts[index - 1].duration! : start)
                            const previousFont = fonts[index - 1]
                            const nextFont = fonts[index + 1]
                            const { length } = font
                            // Lyric font duration. Default to 1000.
                            const duration: number = font.duration || (nextFont && nextFont.start ? nextFont.start - fontStart : 1000)
                            if ((!index && fontStart - start) || (index && fontStart != (previousFont.start || 0) + (previousFont.duration || 0))) {
                                this.writeText(`${fontStart - start}+`)
                            }
                            this.writeText(duration.toString())
                            if (length > 1) {
                                this.text += `/${length}`
                            }
                            if (index < fonts.length - 1) {
                                this.writeText(',')
                            }
                        })
                        this.writeText('>')
                    }
                })
            }
        } else if (this.type == 'json') {
            this.text = JSON.stringify(this.info)
        }
    }
}
