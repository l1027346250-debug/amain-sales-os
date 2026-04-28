import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexHtmlPath = resolve(process.cwd(), 'build', 'index.html');
const beginMarker = '<!-- BEGIN: Twenty Config -->';
const endMarker = '<!-- END: Twenty Config -->';
const serverBaseUrl = process.env.REACT_APP_SERVER_BASE_URL ?? '';

const indexHtml = readFileSync(indexHtmlPath, 'utf8');
const beginIndex = indexHtml.indexOf(beginMarker);
const endIndex = indexHtml.indexOf(endMarker);

if (beginIndex === -1 || endIndex === -1 || endIndex <= beginIndex) {
  throw new Error('Could not find Twenty runtime config markers in build/index.html');
}

const runtimeConfigBlock = `${beginMarker}
    <script id="twenty-env-config">
      window._env_ = {
        REACT_APP_SERVER_BASE_URL: ${JSON.stringify(serverBaseUrl)}
      };
    </script>
    ${endMarker}`;

const nextIndexHtml = [
  indexHtml.slice(0, beginIndex),
  runtimeConfigBlock,
  indexHtml.slice(endIndex + endMarker.length),
].join('');

writeFileSync(indexHtmlPath, nextIndexHtml);

process.stdout.write('Injected runtime environment variables into build/index.html\n');
