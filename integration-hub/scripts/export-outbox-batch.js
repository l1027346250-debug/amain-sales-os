'use strict';

const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const options = {
    baseUrl: 'http://127.0.0.1:3020',
    limit: 20,
    status: 'ready',
    aggregateType: null,
    eventType: null,
    consumerName: null,
    since: null,
    outFile: path.resolve(process.cwd(), 'tmp', 'outbox-batch.json'),
  };

  for (const argument of argv) {
    if (argument.startsWith('--base-url=')) {
      options.baseUrl = argument.slice('--base-url='.length);
      continue;
    }

    if (argument.startsWith('--limit=')) {
      const value = Number(argument.slice('--limit='.length));

      if (!Number.isNaN(value) && value > 0) {
        options.limit = value;
      }

      continue;
    }

    if (argument.startsWith('--status=')) {
      const value = argument.slice('--status='.length);

      if (value === 'ready' || value === 'processed') {
        options.status = value;
      }

      continue;
    }

    if (argument.startsWith('--aggregate-type=')) {
      options.aggregateType = argument.slice('--aggregate-type='.length) || null;
      continue;
    }

    if (argument.startsWith('--event-type=')) {
      options.eventType = argument.slice('--event-type='.length) || null;
      continue;
    }

    if (argument.startsWith('--consumer-name=')) {
      options.consumerName = argument.slice('--consumer-name='.length) || null;
      continue;
    }

    if (argument.startsWith('--since=')) {
      options.since = argument.slice('--since='.length) || null;
      continue;
    }

    if (argument.startsWith('--out-file=')) {
      options.outFile = path.resolve(argument.slice('--out-file='.length));
    }
  }

  return options;
}

async function requestJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText} ${text}`,
    );
  }

  return body;
}

function buildOutboxUrl(options) {
  const pathname =
    options.status === 'processed' ? '/api/outbox/events' : '/api/outbox/consume';
  const url = new URL(pathname, options.baseUrl);

  url.searchParams.set('limit', String(options.limit));
  url.searchParams.set('status', options.status);

  if (options.aggregateType) {
    url.searchParams.set('aggregateType', options.aggregateType);
  }

  if (options.eventType) {
    url.searchParams.set('eventType', options.eventType);
  }

  if (options.consumerName) {
    url.searchParams.set('consumerName', options.consumerName);
  }

  if (options.since) {
    url.searchParams.set('since', options.since);
  }

  return url.toString();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const batch = await requestJson(buildOutboxUrl(options));
  const output =
    options.status === 'processed'
      ? {
          exportedAt: new Date().toISOString(),
          eventCount: batch.total ?? batch.events?.length ?? 0,
          aggregateType: options.aggregateType,
          eventType: options.eventType,
          consumerName: options.consumerName,
          since: options.since,
          status: options.status,
          events: batch.events ?? [],
        }
      : {
          ...batch,
          status: options.status,
        };

  fs.mkdirSync(path.dirname(options.outFile), { recursive: true });
  fs.writeFileSync(options.outFile, JSON.stringify(output, null, 2));

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        outFile: options.outFile,
        eventCount: output.eventCount ?? 0,
        statusFilter: options.status,
        aggregateType: output.aggregateType ?? null,
        eventType: output.eventType ?? null,
        consumerName: options.consumerName,
        since: output.since ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
