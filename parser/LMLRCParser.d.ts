import LyricsParser, { type LyricLine, type LyricInfo, type LyricsInfoRule } from '../LyricsParser.js';
export type LMLRCType = 'text' | 'json';
export default class LMLRCParser extends LyricsParser<LMLRCType> {
    readonly version: string;
    readonly author: string;
    protected type: LMLRCType;
    protected setNoteRules(): RegExp[];
    protected setInfoRules(): LyricsInfoRule[];
    protected readPreprocess(text: string): string[];
    protected getTimeString(start: number, end?: number, previousLine?: LyricLine): string;
    protected compile(info: LyricInfo): void;
}
