import LRCParser from './parser/LRCParser.js';
import NRCParser from './parser/NRCParser.js';
import QRCParser from './parser/QRCParser.js';
import LMLRCParser from './parser/LMLRCParser.js';
declare const LMLRC: {
    LRCParser: typeof LRCParser;
    NRCParser: typeof NRCParser;
    QRCParser: typeof QRCParser;
    LMLRCParser: typeof LMLRCParser;
};
export default LMLRC;
