#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const FRONTEND_BASE_URL =
  process.env.TRADE_CRM_FRONTEND_BASE_URL || 'http://127.0.0.1:4175';
const METADATA_URL =
  process.env.TRADE_CRM_METADATA_URL || 'http://127.0.0.1:3000/metadata';
const GRAPHQL_URL =
  process.env.TRADE_CRM_GRAPHQL_URL || 'http://127.0.0.1:3000/graphql';
const LOGIN_EMAIL = process.env.TRADE_CRM_RUNTIME_EMAIL || 'tim@apple.dev';
const LOGIN_PASSWORD =
  process.env.TRADE_CRM_RUNTIME_PASSWORD || 'tim@apple.dev';
const TARGET_EMAIL =
  process.env.TRADE_CRM_DEVELOPMENT_EMAIL_TARGET || 'buyer@example.com';
const WEBHOOK_SECRET =
  process.env.DEVELOPMENT_EMAIL_WEBHOOK_SECRET ||
  process.env.DEVELOPMENT_EMAIL_TRACKING_SECRET ||
  process.env.APP_SECRET ||
  process.env.AUTH_SECRET ||
  'trade-crm-dev-secret';
const TMP_DIR = path.join(process.cwd(), 'tmp');
const JSON_OUTPUT = path.join(TMP_DIR, 'development-email-runtime-flow.json');

const ensureTmpDir = () => {
  fs.mkdirSync(TMP_DIR, { recursive: true });
};

const decodeJwtPayload = (token) => {
  const encodedPayload = token.split('.')[1];

  if (!encodedPayload) {
    throw new Error('JWT payload is missing');
  }

  const normalizedPayload = encodedPayload
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const payloadJson = Buffer.from(normalizedPayload, 'base64').toString('utf8');

  return JSON.parse(payloadJson);
};

const postGraphql = async ({ url, query, variables, accessToken }) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      `GraphQL HTTP ${response.status}: ${JSON.stringify(json).slice(0, 500)}`,
    );
  }

  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join('; '));
  }

  return json.data;
};

const postJson = async ({ url, body, headers }) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(headers ?? {}),
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    text,
  };
};

const getTokenPair = async () => {
  const loginData = await postGraphql({
    url: METADATA_URL,
    query: `
      mutation Login($email:String!,$password:String!,$origin:String!) {
        getLoginTokenFromCredentials(
          email:$email
          password:$password
          origin:$origin
        ) {
          loginToken {
            token
            expiresAt
          }
        }
      }
    `,
    variables: {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
      origin: FRONTEND_BASE_URL,
    },
  });

  const loginToken =
    loginData?.getLoginTokenFromCredentials?.loginToken?.token ?? null;

  if (!loginToken) {
    throw new Error('Missing login token');
  }

  const authData = await postGraphql({
    url: METADATA_URL,
    query: `
      mutation Auth($loginToken:String!,$origin:String!) {
        getAuthTokensFromLoginToken(loginToken:$loginToken, origin:$origin) {
          tokens {
            accessOrWorkspaceAgnosticToken {
              token
              expiresAt
            }
            refreshToken {
              token
              expiresAt
            }
          }
        }
      }
    `,
    variables: {
      loginToken,
      origin: FRONTEND_BASE_URL,
    },
  });

  const tokenPair = authData?.getAuthTokensFromLoginToken?.tokens ?? null;

  if (!tokenPair?.accessOrWorkspaceAgnosticToken?.token) {
    throw new Error('Missing workspace access token');
  }

  return {
    loginToken,
    tokenPair,
  };
};

const runMutation = async ({ accessToken, query, variables, fieldName }) => {
  const data = await postGraphql({
    url: GRAPHQL_URL,
    query,
    variables,
    accessToken,
  });

  return data?.[fieldName] ?? null;
};

const runQuery = async ({ accessToken, query, variables, fieldName }) => {
  const data = await postGraphql({
    url: GRAPHQL_URL,
    query,
    variables,
    accessToken,
  });

  return fieldName ? (data?.[fieldName] ?? null) : data;
};

const main = async () => {
  ensureTmpDir();

  const suffix = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
  const audienceEmail = TARGET_EMAIL.replace('@', `+devflow-${suffix}@`);
  const campaignName = `Dev Email Flow ${suffix}`;
  const templateName = `Dev Template ${suffix}`;
  const output = {
    generatedAt: new Date().toISOString(),
    frontendBaseUrl: FRONTEND_BASE_URL,
    metadataUrl: METADATA_URL,
    graphqlUrl: GRAPHQL_URL,
    loginEmail: LOGIN_EMAIL,
    audienceEmail,
    campaignName,
    templateName,
    steps: [],
  };

  const pushStep = (name, details) => {
    output.steps.push({
      name,
      recordedAt: new Date().toISOString(),
      ...details,
    });
  };

  try {
    const { loginToken, tokenPair } = await getTokenPair();
    const accessToken = tokenPair.accessOrWorkspaceAgnosticToken.token;
    const loginPayload = decodeJwtPayload(loginToken);
    const workspaceId = loginPayload.workspaceId;

    output.workspaceId = workspaceId;
    pushStep('auth', {
      ok: true,
      workspaceId,
      accessTokenExpiresAt:
        tokenPair.accessOrWorkspaceAgnosticToken.expiresAt ?? null,
    });

    const audience = await runMutation({
      accessToken,
      fieldName: 'createDevelopmentEmailAudience',
      query: `
        mutation CreateAudience($input: CreateDevelopmentEmailAudienceInput!) {
          createDevelopmentEmailAudience(input: $input) {
            id
            email
            displayName
            subscriptionStatus
            source
            tags
          }
        }
      `,
      variables: {
        input: {
          email: audienceEmail,
          displayName: `Development Flow ${suffix}`,
          source: 'runtime-verification',
          tags: ['development-email', 'runtime-check'],
        },
      },
    });
    pushStep('createAudience', { ok: true, audience });

    const template = await runMutation({
      accessToken,
      fieldName: 'createDevelopmentEmailTemplate',
      query: `
        mutation CreateTemplate($input: CreateDevelopmentEmailTemplateInput!) {
          createDevelopmentEmailTemplate(input: $input) {
            id
            name
            subject
            status
            version
          }
        }
      `,
      variables: {
        input: {
          name: templateName,
          subject: `Development Email Flow ${suffix}`,
          bodyHtml:
            '<p>Hello from development-email runtime verification.</p><p><a href="https://example.com/offer">Open offer</a></p>',
          bodyText:
            'Hello from development-email runtime verification. Open offer: https://example.com/offer',
        },
      },
    });
    pushStep('createTemplate', { ok: true, template });

    const campaign = await runMutation({
      accessToken,
      fieldName: 'createDevelopmentEmailCampaign',
      query: `
        mutation CreateCampaign($input: CreateDevelopmentEmailCampaignInput!) {
          createDevelopmentEmailCampaign(input: $input) {
            id
            name
            status
            templateId
          }
        }
      `,
      variables: {
        input: {
          name: campaignName,
          templateId: template.id,
        },
      },
    });
    pushStep('createCampaign', { ok: true, campaign });

    const sendJob = await runMutation({
      accessToken,
      fieldName: 'queueDevelopmentEmailCampaign',
      query: `
        mutation QueueCampaign($input: QueueDevelopmentEmailCampaignInput!) {
          queueDevelopmentEmailCampaign(input: $input) {
            id
            campaignId
            status
            queuedCount
            sentCount
            failedCount
          }
        }
      `,
      variables: {
        input: {
          campaignId: campaign.id,
        },
      },
    });
    pushStep('queueCampaign', { ok: true, sendJob });

    const startedSendJob = await runMutation({
      accessToken,
      fieldName: 'startDevelopmentEmailSendJob',
      query: `
        mutation StartSendJob($input: StartDevelopmentEmailSendJobInput!) {
          startDevelopmentEmailSendJob(input: $input) {
            id
            status
            queuedCount
            sentCount
            failedCount
          }
        }
      `,
      variables: {
        input: {
          sendJobId: sendJob.id,
        },
      },
    });
    pushStep('startSendJob', { ok: true, startedSendJob });

    const executedSendJob = await runMutation({
      accessToken,
      fieldName: 'executeDevelopmentEmailSendJob',
      query: `
        mutation ExecuteSendJob($input: ExecuteDevelopmentEmailSendJobInput!) {
          executeDevelopmentEmailSendJob(input: $input) {
            id
            status
            queuedCount
            sentCount
            failedCount
          }
        }
      `,
      variables: {
        input: {
          sendJobId: sendJob.id,
        },
      },
    });
    pushStep('executeSendJob', { ok: true, executedSendJob });

    const sendTasks = await runQuery({
      accessToken,
      fieldName: 'getDevelopmentEmailSendTasks',
      query: `
        query GetSendTasks($sendJobId: String) {
          getDevelopmentEmailSendTasks(sendJobId: $sendJobId) {
            id
            sendJobId
            campaignId
            audienceId
            templateId
            connectedAccountId
            status
            retryCount
            providerMessageId
            lastError
            sentAt
          }
        }
      `,
      variables: {
        sendJobId: sendJob.id,
      },
    });
    pushStep('getSendTasks', {
      ok: true,
      sendTaskCount: sendTasks.length,
      sendTasks: sendTasks.map((sendTask) => ({
        id: sendTask.id,
        status: sendTask.status,
        connectedAccountId: sendTask.connectedAccountId,
        providerMessageId: sendTask.providerMessageId,
        lastError: sendTask.lastError,
      })),
    });

    const primarySendTask = sendTasks[0] ?? null;

    if (!primarySendTask) {
      throw new Error('No send task returned for queued send job');
    }

    const trackingLinks = await runQuery({
      accessToken,
      fieldName: 'getDevelopmentEmailTrackingLinks',
      query: `
        query GetTrackingLinks($input: GenerateDevelopmentEmailTrackingLinksInput!) {
          getDevelopmentEmailTrackingLinks(input: $input) {
            openTrackingUrl
            clickTrackingUrl
            expiresAt
          }
        }
      `,
      variables: {
        input: {
          email: audienceEmail,
          campaignId: campaign.id,
          sendJobId: sendJob.id,
          sendTaskId: primarySendTask.id,
          provider: 'runtime-verification',
          targetUrl: 'https://example.com/offer',
        },
      },
    });
    pushStep('generateTrackingLinks', { ok: true, trackingLinks });

    const openResponse = await fetch(trackingLinks.openTrackingUrl);
    const clickResponse = await fetch(trackingLinks.clickTrackingUrl, {
      redirect: 'manual',
    });
    pushStep('publicTracking', {
      ok: openResponse.ok,
      openStatus: openResponse.status,
      clickStatus: clickResponse.status,
      clickLocation: clickResponse.headers.get('location'),
    });

    const providerCallback = await postJson({
      url: 'http://127.0.0.1:3000/development-email/webhook/provider',
      headers: {
        'x-development-email-webhook-secret': WEBHOOK_SECRET,
        'x-development-email-provider-format': 'unified',
      },
      body: {
        workspaceId,
        eventType: 'delivered',
        email: audienceEmail,
        campaignId: campaign.id,
        sendJobId: sendJob.id,
        sendTaskId: primarySendTask.id,
        provider: 'runtime-verification',
        providerMessageId:
          primarySendTask.providerMessageId ?? `runtime-${primarySendTask.id}`,
        source: 'runtime-verification',
        metadata: {
          note: 'Simulated provider callback from runtime verification',
        },
        occurredAt: new Date().toISOString(),
      },
    });
    pushStep('providerCallback', {
      ok: providerCallback.ok,
      status: providerCallback.status,
      text: providerCallback.text,
    });

    const sendJobSummary = await runQuery({
      accessToken,
      fieldName: 'getDevelopmentEmailSendJobSummary',
      query: `
        query GetSendJobSummary($sendJobId: String!) {
          getDevelopmentEmailSendJobSummary(sendJobId: $sendJobId) {
            metrics {
              label
              value
              description
            }
            listItems {
              id
              primary
              secondary
              tertiary
              meta
              status
            }
          }
        }
      `,
      variables: {
        sendJobId: sendJob.id,
      },
    });
    pushStep('getSendJobSummary', {
      ok: true,
      metricCount: sendJobSummary.metrics.length,
      listItemCount: sendJobSummary.listItems.length,
    });

    const analytics = await runQuery({
      accessToken,
      fieldName: 'getDevelopmentEmailAnalytics',
      query: `
        query GetAnalytics {
          getDevelopmentEmailAnalytics {
            metrics {
              label
              value
              description
            }
            listItems {
              id
              primary
              secondary
              tertiary
              meta
              status
            }
          }
        }
      `,
      variables: {},
    });
    pushStep('getAnalytics', {
      ok: true,
      metricCount: analytics.metrics.length,
      listItemCount: analytics.listItems.length,
    });

    output.result = {
      status: 'completed',
      workspaceId,
      audience,
      template,
      campaign,
      sendJob: executedSendJob,
      primarySendTask,
      trackingLinks,
      providerCallback,
      sendJobSummary,
      analytics,
    };
  } catch (error) {
    output.result = {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(output, null, 2));
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);

  if (output.result.status !== 'completed') {
    process.exitCode = 1;
  }
};

void main();
