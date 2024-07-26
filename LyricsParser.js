// Lyrics parser status code.
export var LyricsParserState;
(function (LyricsParserState) {
    LyricsParserState[LyricsParserState["Created"] = 0] = "Created";
    LyricsParserState[LyricsParserState["GettedText"] = 1] = "GettedText";
    LyricsParserState[LyricsParserState["GettedInfo"] = 2] = "GettedInfo";
})(LyricsParserState || (LyricsParserState = {}));
// Abstract class for lyrics parsers.
export default class LyricsParser {
    // Set error message for lyrics parser.
    setError(error) {
        this.error.message = error;
    }
    get(name) {
        if (name == 'error') {
            return this[name].message;
        }
        if (name == 'noteRules') {
            return this.rules.note;
        }
        if (name == 'infoRules') {
            return this.rules.info;
        }
        return this[name];
    }
    set(name, value) {
        switch (name) {
            case 'type':
                this[name] = value;
                break;
            case 'text':
                this.text = value;
                this.state = LyricsParserState.GettedText;
                break;
            case 'info':
                this.info = value;
                this.state = LyricsParserState.GettedInfo;
                break;
            case 'extraInfo':
                this.extraInfo = value;
                break;
        }
    }
    // Add info read rule for lyrics parser.
    addInfoRule({ name, regexp, method }) {
        if (!method) {
            method = (matched) => {
                if (name == 'offset') {
                    return +matched[1];
                }
                return matched[1];
            };
        }
        this.rules.info.push({ name, regexp, method });
    }
    // Add read rules for lyrics parser.
    addRules() {
        this.rules.note = this.setNoteRules();
        const infoRules = this.setInfoRules();
        for (const infoRule of infoRules) {
            this.addInfoRule(infoRule);
        }
    }
    // Initialization for read.
    readInit() {
        this.info = {};
        this.extraInfo = {};
    }
    // Remove all notes by note read rules.
    removeNotes(text) {
        for (const regexp of this.rules.note) {
            const matched = text.match(regexp);
            if (matched) {
                for (const note of matched) {
                    text = text.replace(note, '');
                }
            }
        }
        return text;
    }
    removeBlankLines(lines) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const text = typeof line == 'string' ? line : line.text || '';
            if (!text.trim()) {
                lines.splice(i--, 1);
            }
        }
    }
    // Split lyric text to lines.
    splitToLines(text) {
        const lines = text.split('\n');
        lines.forEach((value, index) => {
            lines[index] = value.trim();
        });
        this.removeBlankLines(lines);
        return lines;
    }
    // Preprocess for read.
    readPreprocess(text) {
        text = this.removeNotes(text);
        return this.splitToLines(text);
    }
    // Read lyric text line by info read rules.
    readLine(line) {
        for (const rule of this.rules.info) {
            const { name, regexp, method } = rule;
            // Try to match rule.
            const matched = line.match(regexp);
            // Execute the method when the match is successful.
            if (matched && method) {
                const result = method(matched, this.info);
                this.info[name] = result;
            }
        }
    }
    // Post process for read.
    readPostProcess() {
        const { lines } = this.info;
        if (lines) {
            this.removeBlankLines(lines);
        }
    }
    // Read process.
    readProcess() {
        this.readInit();
        const lines = this.readPreprocess(this.text);
        for (const line of lines) {
            this.readLine(line);
        }
        this.readPostProcess();
        this.state = LyricsParserState.GettedInfo;
    }
    // Read lyric text to get lyric info.
    read() {
        switch (this.state) {
            case LyricsParserState.Created:
                this.setError('Please set text.');
                throw this.error;
            case LyricsParserState.GettedText:
                this.readProcess();
                break;
        }
        return this.info;
    }
    // Initialization for write.
    writeInit() {
        this.text = '';
    }
    // Preprocess for write.
    writePreprocess(info) {
        if (info.lines) {
            this.removeBlankLines(info.lines);
        }
    }
    // Write text to lyric text.
    writeText(text) {
        this.text += text;
    }
    // Add line feed.
    addLineFeed() {
        if (this.text) {
            this.writeText('\n');
        }
    }
    // Write text with line breaks to lyric text.
    writeLine(text) {
        this.addLineFeed();
        this.writeText(text);
    }
    // Pad string to start to target length.
    padStart(text, targetLength, padString) {
        while (text.length < targetLength) {
            const missingLength = targetLength - text.length;
            const length = padString.length < missingLength ? padString.length : missingLength;
            text = padString.substring(0, length) + text;
        }
        return text;
    }
    // Pad string to a int number start to get a string with target length.
    padStartInt(number, length) {
        let numberString = number.toString();
        number = parseInt(numberString);
        numberString = number.toString();
        numberString = this.padStart(numberString, length, '0');
        return numberString;
    }
    // Write process.
    writeProcess() {
        this.writeInit();
        this.writePreprocess(this.info);
        this.compile(this.info);
        this.state = LyricsParserState.GettedText;
    }
    // Read lyric info to get lyric text.
    write() {
        switch (this.state) {
            case LyricsParserState.Created:
                this.setError('Please set info.');
                throw this.error;
            case LyricsParserState.GettedInfo:
                this.writeProcess();
                break;
        }
        return this.text;
    }
    // Add translation to info.
    addTranslationToinfo({ start, end, text }) {
        const state = {
            difference: {
                start: Infinity,
                end: Infinity
            }
        };
        const { info } = this;
        // Get the closest line.
        for (const line of info.lines) {
            const startDifference = line.start && start ? Math.abs(line.start - start) : Infinity;
            const endDifference = line.end && end ? Math.abs(line.end - end) : Infinity;
            const { difference } = state;
            if (startDifference < difference.start) {
                difference.start = startDifference;
                difference.end = endDifference;
                state.translation = text;
                state.line = line;
            }
            else if (startDifference == difference.start && endDifference < difference.end) {
                difference.end = endDifference;
                state.translation = text;
                state.line = line;
            }
        }
        // Bind translation.
        if (state.line) {
            state.line.translation = state.translation;
        }
    }
    // Bind translation.
    bindTranslation({ author, version, lines } = {}) {
        const { info } = this;
        if (author) {
            info.translationAuthor = author;
        }
        if (version) {
            info.translationVersion = version;
        }
        if (lines) {
            for (const line of lines) {
                this.addTranslationToinfo(line);
            }
        }
    }
    constructor({ type, text, info, extraInfo } = {}) {
        // Lyrics parser status code. Default to LyricsParserState.Created.
        this.state = LyricsParserState.Created;
        // Lyrics parser error. Default to a new Error with message of ''.
        this.error = new Error;
        // Lyric text. Default to ''.
        this.text = '';
        // Lyric info. Default to {}.
        this.info = {};
        // Lyric extra info. Default is {}.
        this.extraInfo = {};
        // Lyrics read rules.
        this.rules = {
            note: [],
            info: []
        };
        if (type) {
            this.set('type', type);
        }
        if (text) {
            this.set('text', text);
        }
        if (info) {
            this.set('info', info);
        }
        if (extraInfo) {
            this.set('extraInfo', extraInfo);
        }
        this.addRules();
    }
}
