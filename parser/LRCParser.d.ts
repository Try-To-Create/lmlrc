import LyricsParser, { type LyricInfo, type LyricsInfoRule } from '../LyricsParser.js';
export type LRCType = 'text';
export default class LRCParser extends LyricsParser<LRCType> {
    readonly version: string;
    readonly author: string;
    protected type: LRCType;
    protected setNoteRules(): RegExp[];
    protected setInfoRules(): LyricsInfoRule[];
    protected getTimeString(time: number): string;
    protected compile(info: LyricInfo): void;
}
