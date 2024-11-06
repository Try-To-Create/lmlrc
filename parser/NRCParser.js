import LyricsParser from '../LyricsParser.js';
import LRCParser from './LRCParser.js';
// NRC (LMLRC enhanced) format lyric parser.
export default class NRCParser extends LyricsParser {
    constructor() {
        super(...arguments);
        this.version = '1.0.0';
        this.author = 'PlayDrinkEatCode';
        this.type = 'json';
    }
    setNoteRules() {
        return (new LRCParser).get('noteRules');
    }
    setInfoRules() {
        return (new LRCParser).get('infoRules');
    }
    readPreprocess(text) {
        const nrcInfo = JSON.parse(text);
        const { lrc, lyricUser, lyricContributor, tlyric, transUser, translationContributor } = nrcInfo;
        const { info } = this;
        if (lrc) {
            if (lrc.version) {
                info.version = lrc.version.toString();
            }
            text = lrc.lyric || '';
        }
        const author = lyricUser || lyricContributor;
        if (author === null || author === void 0 ? void 0 : author.nickname) {
            info.author = author.nickname;
        }
        if (tlyric) {
            if (tlyric.version) {
                info.translationVersion = tlyric.version.toString();
            }
            if (tlyric.lyric) {
                const { extraInfo } = this;
                extraInfo.translation = new LRCParser({ text: tlyric.lyric }).read();
            }
        }
        const translationAuthor = transUser || translationContributor;
        if (translationAuthor === null || translationAuthor === void 0 ? void 0 : translationAuthor.nickname) {
            info.translationAuthor = translationAuthor.nickname;
        }
        return super.readPreprocess(text);
    }
    readPostProcess() {
        super.readPostProcess();
        const { translation } = this.extraInfo;
        if (translation) {
            this.bindTranslation(translation);
        }
    }
    // Compile to json format.
    complieToJSON(text, translation) {
        const { info } = this;
        const { author, version, translationAuthor, translationVersion } = info;
        const nrcInfo = {
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
        };
        if (author) {
            nrcInfo.lyricUser = {
                nickname: author
            };
            nrcInfo.lyricContributor = {
                nickname: author
            };
        }
        if (translation) {
            nrcInfo.tlyric = {
                version: parseInt(translationVersion || '1'),
                lyric: translation
            };
            if (translationAuthor) {
                nrcInfo.transUser = {
                    nickname: translationAuthor
                };
                nrcInfo.translationContributor = {
                    nickname: translationAuthor
                };
            }
        }
        return JSON.stringify(nrcInfo);
    }
    compile(info) {
        const { title, artist, album, offset, lines } = info;
        const textInfo = { title, artist, album, offset };
        const translationInfo = {};
        if (lines) {
            textInfo.lines = [];
            translationInfo.lines = [];
            for (const line of lines) {
                textInfo.lines.push({ start: line.start, text: line.text });
                translationInfo.lines.push({ start: line.start, text: line.translation });
            }
        }
        const text = new LRCParser({ info: textInfo }).write();
        const translation = new LRCParser({ info: translationInfo }).write();
        this.text = this.complieToJSON(text, translation || undefined);
    }
}
