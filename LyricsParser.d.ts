export interface LyricFont {
    start?: number;
    duration?: number;
    length: number;
}
export interface LyricLine {
    start?: number;
    end?: number;
    text?: string;
    translation?: string;
    fonts?: LyricFont[];
}
export interface LyricInfo {
    title?: string;
    artist?: string;
    album?: string;
    author?: string;
    translationAuthor?: string;
    version?: string;
    translationVersion?: string;
    offset?: number;
    lines?: LyricLine[];
}
export interface LyricExtraInfo {
    [key: string]: string | number | boolean | LyricInfo;
}
export interface LyricsParserOptions<TYPE> {
    type?: TYPE;
    text?: string;
    info?: LyricInfo;
    extraInfo?: LyricExtraInfo;
}
export declare enum LyricsParserState {
    Created = 0,
    GettedText = 1,
    GettedInfo = 2
}
export interface LyricsInfoRule {
    name: keyof LyricInfo;
    regexp: RegExp;
    method?: (matched: RegExpMatchArray, info: LyricInfo) => any;
}
export interface LyricsRules {
    note: RegExp[];
    info: LyricsInfoRule[];
}
export default abstract class LyricsParser<TYPE extends string> {
    abstract readonly version: string;
    abstract readonly author: string;
    protected abstract type: TYPE;
    protected state: LyricsParserState;
    protected error: Error;
    protected text: string;
    protected info: LyricInfo;
    protected extraInfo: LyricExtraInfo;
    protected rules: LyricsRules;
    protected setError(error: string): void;
    get(name: 'type'): TYPE;
    get(name: 'state'): LyricsParserState;
    get(name: 'error'): string;
    get(name: 'text'): string;
    get(name: 'info'): LyricInfo;
    get(name: 'extraInfo'): LyricExtraInfo;
    get(name: 'noteRules'): RegExp[];
    get(name: 'infoRules'): LyricsInfoRule[];
    set(name: 'type', value: TYPE): void;
    set(name: 'text', value: string): void;
    set(name: 'info', value: LyricInfo): void;
    set(name: 'extraInfo', value: LyricExtraInfo): void;
    protected addInfoRule({ name, regexp, method }: LyricsInfoRule): void;
    protected abstract setNoteRules(): RegExp[];
    protected abstract setInfoRules(): LyricsInfoRule[];
    protected addRules(): void;
    protected readInit(): void;
    protected removeNotes(text: string): string;
    protected removeBlankLines(lines: string[]): void;
    protected removeBlankLines(lines: LyricLine[]): void;
    protected splitToLines(text: string): string[];
    protected readPreprocess(text: string): string[];
    protected readLine(line: string): void;
    protected readPostProcess(): void;
    protected readProcess(): void;
    read(): LyricInfo;
    protected writeInit(): void;
    protected writePreprocess(info: LyricInfo): void;
    protected writeText(text: string): void;
    protected addLineFeed(): void;
    protected writeLine(text: string): void;
    protected padStart(text: string, targetLength: number, padString: string): string;
    protected padStartInt(number: number, length: number): string;
    protected abstract compile(info: LyricInfo): void;
    protected writeProcess(): void;
    write(): string;
    protected addTranslationToinfo({ start, end, text }: LyricLine): void;
    bindTranslation({ author, version, lines }?: LyricInfo): void;
    constructor({ type, text, info, extraInfo }?: LyricsParserOptions<TYPE>);
}
