import LyricsParser, { type LyricInfo, type LyricsInfoRule } from '../LyricsParser.js';
export type QRCType = 'xml' | 'text';
export default class QRCParser extends LyricsParser<QRCType> {
    readonly version: string;
    readonly author: string;
    protected type: QRCType;
    protected setNoteRules(): RegExp[];
    protected setInfoRules(): LyricsInfoRule[];
    protected readPreprocess(text: string): string[];
    protected readPostProcess(): void;
    protected compileToXML(text: string, translation?: string): void;
    protected compile(info: LyricInfo): void;
}
