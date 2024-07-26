# LMLRC

A lyric parser for LMusic.

## How to use?

### Browser

Copy all files from the [dist branch](https://github.com/Try-To-Create/lmlrc/tree/dist) into your web application directory. 

Or use CDN to obtain files.

- UNPKG: https://unpkg.com/@trytocreate/lmlrc@latest

- jsDelivr: https://cdn.jsdelivr.net/npm/@trytocreate/lmlrc@latest/dist/index.min.js

- Skypack: https://cdn.skypack.dev/@trytocreate/lmlrc@latest?min

- Statically: https://cdn.statically.io/gh/Try-To-Create/lmlrc/dist/index.js

- JSDMirror: https://cdn.jsdmirror.com/npm/@trytocreate/lmlrc@latest/dist/index.min.js

Include [index.js](https://github.com/Try-To-Create/lmlrc/tree/dist/index.js) with a script module tag.

```html
<script type="module" src="https://unpkg.com/@trytocreate/lmlrc@latest"></script>
```

And Obtain it from the window.

```js
const { LMLRC } = window
```

Or import it into your module.

```js
import LMLRC from 'https://unpkg.com/@trytocreate/lmlrc@latest'
```

Read LMLRC format (Other formats are similar) lyric text to obtain lyric info.

```js
const { LMLRCParser } = LMLRC

const text = await fetch('磨瀬_初音未来 (初音ミク) - icicles.lmlrc').then((response) => response.text())

const parser = new LMLRCParser({ text })

console.log('Lyric info:\n', parser.read())
```

See [example for browser](https://github.com/Try-To-Create/lmlrc/tree/main/examples/browser) for more.
