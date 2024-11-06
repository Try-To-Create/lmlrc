import LyricsParser from '../LyricsParser.js';
// LRC (LMLRC enhanced) format lyric parser.
export default class LRCParser extends LyricsParser {
    constructor() {
        super(...arguments);
        this.version = '1.0.0';
        this.author = 'PlayDrinkEatCode';
        this.type = 'text';
    }
    setNoteRules() {
        // Comment method: // note.
        return [/\/\/(?:.*)/g];
    }
    setInfoRules() {
        return [
            { name: 'title', regexp: /^\[ti(?:tle)?:(.*)\]$/ },
            { name: 'artist', regexp: /^\[ar(?:tist)?:(.*)\]$/ },
            { name: 'album', regexp: /^\[al(?:bum)?:(.*)\]$/ },
            { name: 'author', regexp: /^\[(?:by|au(?:thor)?):(.*)\]$/ },
            { name: 'translationAuthor', regexp: /^\[ta:(.*)\]$/ },
            { name: 'version', regexp: /^\[ve(?:rsion)?:(.*)\]$/ },
            { name: 'translationVersion', regexp: /^\[tv:(.*)\]$/ },
            { name: 'offset', regexp: /^\[offset:(.*)\]$/ },
            // Line time rule.
            {
                name: 'lines',
                regexp: /^\[(\d+):(\d+).(\d+)\]/,
                method(matched, info) {
                    const [, minutes, seconds, milliseconds] = matched;
                    // Line start time.
                    let start = 0;
                    start += +minutes * 60 * 1000;
                    start += +seconds * 1000;
                    start += +milliseconds * (milliseconds.length == 2 ? 10 : 1);
                    // Get lyric lines info.
                    const lines = info.lines || [];
                    // Add line end time for previous line.
                    if (lines.length) {
                        lines[lines.length - 1].end = start;
                    }
                    // Add line start time for present line.
                    lines.push({ start });
                    return lines;
                }
            },
            // Line text rule.
            {
                name: 'lines',
                regexp: /^\[\d+:\d+.\d+\](.*)$/,
                method(matched, info) {
                    const text = matched[1];
                    const { lines } = info;
                    if (lines && lines.length) {
                        lines[lines.length - 1].text = text;
                    }
                    return lines;
                }
            },
            // Line translation rule.
            {
                name: 'lines',
                regexp: /^{(.*)}$/,
                method(matched, info) {
                    const translation = matched[1];
                    const { lines } = info;
                    if (lines && lines.length) {
                        lines[lines.length - 1].translation = translation;
                    }
                    return lines;
                }
            }
        ];
    }
    // Get line time string.
    getTimeString(time) {
        const minutes = this.padStartInt(time / 1000 / 60, 2);
        const seconds = this.padStartInt(time / 1000 % 60, 2);
        let milliseconds = this.padStartInt(time % 1000, 3);
        // Reduce length.
        if (milliseconds[2] == '0') {
            milliseconds = milliseconds.substring(0, 2);
        }
        return `[${minutes}:${seconds}\.${milliseconds}]`;
    }
    compile(info) {
        const { title, artist, album, author, translationAuthor, version, translationVersion, offset, lines } = info;
        if (title) {
            this.writeLine(`[ti:${title}]`);
        }
        if (artist) {
            this.writeLine(`[ar:${artist}]`);
        }
        if (album) {
            this.writeLine(`[al:${album}]`);
        }
        if (author) {
            this.writeLine(`[by:${author}]`);
        }
        if (translationAuthor) {
            this.writeLine(`[ta:${translationAuthor}]`);
        }
        if (version) {
            this.writeLine(`[ve:${version}]`);
        }
        if (translationVersion) {
            this.writeLine(`[tv:${translationVersion}]`);
        }
        if (offset) {
            this.writeLine(`[offset:${offset}]`);
        }
        if (lines) {
            lines.forEach((line, index) => {
                const start = line.start || (index > 0 ? lines[index - 1].end || lines[index - 1].start || 0 : 0);
                const { text, translation } = line;
                if (text) {
                    this.writeLine(`${this.getTimeString(start)}${text}`);
                }
                if (translation) {
                    this.writeLine(`{${translation}}`);
                }
            });
        }
    }
}
