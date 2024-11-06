import LyricsParser, { type LyricInfo, type LyricsInfoRule } from '../LyricsParser.js';
export type NRCType = 'json';
export default class NRCParser extends LyricsParser<NRCType> {
    readonly version: string;
    readonly author: string;
    protected type: NRCType;
    protected setNoteRules(): RegExp[];
    protected setInfoRules(): LyricsInfoRule[];
    protected readPreprocess(text: string): string[];
    protected readPostProcess(): void;
    protected complieToJSON(text: string, translation?: string): string;
    protected compile(info: LyricInfo): void;
}
