#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const FRONTEND_BASE_URL =
  process.env.TRADE_CRM_FRONTEND_BASE_URL || 'http://127.0.0.1:4175';
const METADATA_URL =
  process.env.TRADE_CRM_METADATA_URL || 'http://127.0.0.1:3000/metadata';
const LOGIN_EMAIL = process.env.TRADE_CRM_RUNTIME_EMAIL || 'tim@apple.dev';
const LOGIN_PASSWORD =
  process.env.TRADE_CRM_RUNTIME_PASSWORD || 'tim@apple.dev';
const TARGET_PATH = '/sales-workbench';
const EDGE_PATH =
  process.env.PLAYWRIGHT_EDGE_PATH ||
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TMP_DIR = path.join(process.cwd(), 'tmp');
const JSON_OUTPUT = path.join(
  TMP_DIR,
  'sales-workbench-runtime-walkthrough-v2.json',
);
const SCREENSHOT_OUTPUT = path.join(
  TMP_DIR,
  'sales-workbench-runtime-walkthrough-v2.png',
);
const IGNORED_FAILED_REQUEST_PREFIXES = ['https://twenty-icons.com/'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const shouldIgnoreFailedRequest = (url) =>
  IGNORED_FAILED_REQUEST_PREFIXES.some((prefix) => url.startsWith(prefix));

const postGraphql = async (url, query, variables) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(
      `GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`,
    );
  }
  return json.data;
};

const postGraphqlWithToken = async (url, query, variables, accessToken) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(
      `GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`,
    );
  }
  return json.data;
};

const getTokenPair = async () => {
  const loginData = await postGraphql(
    METADATA_URL,
    `mutation Login($email:String!,$password:String!,$origin:String!){
      getLoginTokenFromCredentials(email:$email,password:$password,origin:$origin){
        loginToken { token expiresAt }
      }
    }`,
    {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
      origin: FRONTEND_BASE_URL,
    },
  );

  const loginToken =
    loginData?.getLoginTokenFromCredentials?.loginToken?.token || null;
  if (!loginToken) {
    throw new Error('Missing loginToken from metadata auth mutation');
  }

  const authData = await postGraphql(
    METADATA_URL,
    `mutation Auth($loginToken:String!,$origin:String!){
      getAuthTokensFromLoginToken(loginToken:$loginToken,origin:$origin){
        tokens {
          accessOrWorkspaceAgnosticToken { token expiresAt }
          refreshToken { token expiresAt }
        }
      }
    }`,
    { loginToken, origin: FRONTEND_BASE_URL },
  );

  const tokens = authData?.getAuthTokensFromLoginToken?.tokens || null;
  if (!tokens?.accessOrWorkspaceAgnosticToken?.token || !tokens?.refreshToken?.token) {
    throw new Error('Missing auth tokens from metadata auth token exchange');
  }

  return tokens;
};

const getOnboardingStatus = async (accessToken) => {
  try {
    const data = await postGraphqlWithToken(
      METADATA_URL,
      `query CurrentUserOnboardingStatus {
        currentUser {
          onboardingStatus
        }
      }`,
      {},
      accessToken,
    );
    return data?.currentUser?.onboardingStatus ?? null;
  } catch {
    return null;
  }
};

const trySkipOnboardingSteps = async (accessToken) => {
  try {
    const data = await postGraphqlWithToken(
      METADATA_URL,
      `mutation TrySkipOnboardingSteps {
        skipSyncEmailOnboardingStep {
          success
        }
        skipBookOnboardingStep {
          success
        }
      }`,
      {},
      accessToken,
    );
    return {
      skipSyncEmailOnboardingStep:
        data?.skipSyncEmailOnboardingStep?.success ?? null,
      skipBookOnboardingStep: data?.skipBookOnboardingStep?.success ?? null,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const clickFirstByText = async (page, selectors) => {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0) {
      await locator.click({ timeout: 2000 });
      return selector;
    }
  }
  return null;
};

const hasWorkbenchSurface = async (page) => {
  return page.evaluate(() => {
    const cardTestIds = [
      'sales-workbench-block-lead-first-response-risk',
      'sales-workbench-block-tasks-due-today',
      'sales-workbench-block-today-new-leads',
      'sales-workbench-block-my-pipeline-needing-next-action',
    ];
    const foundCardTestIds = cardTestIds.filter(
      (testId) => document.querySelector(`[data-testid="${testId}"]`) != null,
    );
    const errorFallbackVisible =
      document.querySelector(
        'img[src="/images/placeholders/background/error_index_bg.png"]',
      ) != null;
    const bodyText = document.body?.innerText ?? '';
    const textSignals = [
      'Sales Workbench',
      'Immediate Action',
      'Pipeline Follow-Through',
    ];
    const matchedTextSignals = textSignals.filter((signal) =>
      bodyText.includes(signal),
    );
    return {
      cardTestIdCount: foundCardTestIds.length,
      foundCardTestIds,
      errorFallbackVisible,
      matchedTextSignals,
    };
  });
};

const main = async () => {
  fs.mkdirSync(TMP_DIR, { recursive: true });

  // Keep a fresh token probe as runtime evidence, but use direct form auth for workspace-scope flow.
  const tokenPair = await getTokenPair();
  const accessToken = tokenPair.accessOrWorkspaceAgnosticToken.token;
  const onboardingStatusBefore = await getOnboardingStatus(accessToken);
  const onboardingSkipAttempt = await trySkipOnboardingSteps(accessToken);
  const onboardingStatusAfter = await getOnboardingStatus(accessToken);
  const encodedTokenPair = encodeURIComponent(
    JSON.stringify({
      accessOrWorkspaceAgnosticToken: tokenPair.accessOrWorkspaceAgnosticToken,
      refreshToken: tokenPair.refreshToken,
    }),
  );
  const bootstrapUrl = `${FRONTEND_BASE_URL}/welcome?tokenPair=${encodedTokenPair}&returnToPath=${encodeURIComponent(TARGET_PATH)}`;

  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(EDGE_PATH) ? EDGE_PATH : undefined,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  const failedGraphqlOperations = [];
  const failedRequestsOnWorkbenchRoute = [];
  const failedGraphqlOperationsOnWorkbenchRoute = [];
  const requestRouteMap = new WeakMap();
  page.on('request', (request) => {
    requestRouteMap.set(request, new URL(page.url()).pathname);
  });
  page.on('pageerror', (error) => {
    pageErrors.push(String(error));
  });
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      const request = response.request();
      const url = response.url();
      if (shouldIgnoreFailedRequest(url)) {
        return;
      }
      const routeAtCapture = new URL(page.url()).pathname;
      const routeAtRequest = requestRouteMap.get(request) ?? null;
      const record = { status, url, routeAtCapture, routeAtRequest };

      if (url.includes('/graphql')) {
        const postData = request.postData();
        let graphqlRecord = null;
        if (postData) {
          try {
            const parsed = JSON.parse(postData);
            const operationName = parsed.operationName ?? null;
            const query =
              typeof parsed.query === 'string' ? parsed.query : null;
            graphqlRecord = {
              status,
              url,
              routeAtCapture,
              routeAtRequest,
              operationName,
              querySnippet: query ? query.slice(0, 300) : null,
            };
          } catch {
            graphqlRecord = {
              status,
              url,
              routeAtCapture,
              routeAtRequest,
              operationName: null,
              querySnippet: null,
            };
          }
        } else {
          graphqlRecord = {
            status,
            url,
            routeAtCapture,
            routeAtRequest,
            operationName: null,
            querySnippet: null,
          };
        }
        failedGraphqlOperations.push(graphqlRecord);
        if (routeAtCapture === TARGET_PATH) {
          failedGraphqlOperationsOnWorkbenchRoute.push(graphqlRecord);
        }
      }

      failedRequests.push(record);
      if (routeAtCapture === TARGET_PATH) {
        failedRequestsOnWorkbenchRoute.push(record);
      }
    }
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const isIgnoredFailedRequestLog = IGNORED_FAILED_REQUEST_PREFIXES.some(
        (prefix) => text.includes(prefix),
      );

      if (!isIgnoredFailedRequestLog) {
        consoleErrors.push(text);
      }
    }
  });

  const steps = [];
  await page.goto(bootstrapUrl, {
    waitUntil: 'domcontentloaded',
  });
  await sleep(1000);

  let reachedWorkbench = false;
  for (let i = 0; i < 12; i += 1) {
    const url = page.url();
    const route = new URL(url).pathname;
    const title = await page.title();
    steps.push({ index: i, route, title });

    if (route === TARGET_PATH) {
      reachedWorkbench = true;
      break;
    }

    if (route === '/welcome') {
      const email = page.locator('input[type="email"]').first();
      if ((await email.count()) > 0) {
        await email.fill(LOGIN_EMAIL);
        const password = page.locator('input[type="password"]').first();
        const hasPasswordField = (await password.count()) > 0;
        if (hasPasswordField) {
          await password.fill(LOGIN_PASSWORD);
        }
        const submitButton = page.locator('form button[type="submit"]').first();
        if ((await submitButton.count()) > 0) {
          await submitButton.click({ timeout: 2000 });
        } else if (!hasPasswordField) {
          await clickFirstByText(page, [
            'button:has-text("Continue")',
            'button:has-text("继续")',
          ]);
        } else {
          await page.keyboard.press('Enter');
        }
      } else {
        const submitButton = page.locator('form button[type="submit"]').first();
        if ((await submitButton.count()) > 0) {
          await submitButton.click({ timeout: 2000 });
        } else {
          await clickFirstByText(page, [
            'button:has-text("Continue")',
            'button:has-text("继续")',
            'button:has-text("Continue with Email")',
          ]);
        }
      }
      await sleep(1500);
      continue;
    }

    if (route !== '/welcome' && route !== TARGET_PATH) {
      await page.goto(`${FRONTEND_BASE_URL}${TARGET_PATH}`, {
        waitUntil: 'domcontentloaded',
      });
      await sleep(1200);
      const redirectedRoute = new URL(page.url()).pathname;
      steps.push({
        index: i,
        route,
        redirectToWorkbenchAttempt: true,
        redirectedRoute,
      });
      if (redirectedRoute === TARGET_PATH) {
        reachedWorkbench = true;
        break;
      }
      continue;
    }

    if (route === '/create/workspace') {
      const nameInput = page.locator('input[placeholder="Apple"]').first();
      if ((await nameInput.count()) > 0) {
        await nameInput.fill('Apple Trade CRM');
      }
      await clickFirstByText(page, [
        'button:has-text("Continue")',
        'button:has-text("继续")',
      ]);
      await sleep(1800);
      continue;
    }

    if (route === '/create/profile') {
      const firstName = page.locator('input[placeholder="Tim"]').first();
      const lastName = page.locator('input[placeholder="Cook"]').first();
      if ((await firstName.count()) > 0) {
        await firstName.fill('Tim');
      }
      if ((await lastName.count()) > 0) {
        await lastName.fill('Apple');
      }
      await clickFirstByText(page, [
        'button:has-text("Continue")',
        'button:has-text("继续")',
      ]);
      await sleep(1200);
      continue;
    }

    if (route === '/sync/emails') {
      const clicked = await clickFirstByText(page, [
        'a:has-text("Continue without sync")',
        'a:has-text("继续")',
        'button:has-text("Continue")',
        'button:has-text("继续")',
      ]);
      if (!clicked) {
        await page.keyboard.press('Enter');
      }
      await sleep(1200);
      continue;
    }

    if (route === '/invite-team') {
      const clicked = await clickFirstByText(page, [
        'a:has-text("Skip")',
        'a:has-text("跳过")',
        'button:has-text("Finish")',
        'button:has-text("完成")',
        'button:has-text("Continue")',
        'button:has-text("继续")',
      ]);
      if (!clicked) {
        await page.keyboard.press('Enter');
      }
      await sleep(1200);
      continue;
    }

    // Fallback: if we reach a route we don't explicitly handle, try to continue.
    const clicked = await clickFirstByText(page, [
      'button:has-text("Continue")',
      'button:has-text("继续")',
      'a:has-text("Skip")',
      'a:has-text("跳过")',
    ]);
    steps.push({ index: i, route, fallbackClick: clicked || 'none' });
    await sleep(1200);
  }

  if (!reachedWorkbench) {
    await page.goto(`${FRONTEND_BASE_URL}${TARGET_PATH}`, {
      waitUntil: 'domcontentloaded',
    });
    await sleep(1000);
    if (new URL(page.url()).pathname === TARGET_PATH) {
      reachedWorkbench = true;
      steps.push({
        index: steps.length,
        route: TARGET_PATH,
        recoveredByDirectOpen: true,
      });
    }
  }

  await page.screenshot({ path: SCREENSHOT_OUTPUT, fullPage: true });
  const bodyText = await page.locator('body').innerText();
  const workbenchSurface = await hasWorkbenchSurface(page);
  const domDiagnostics = await page.evaluate(() => {
    const testIds = Array.from(
      document.querySelectorAll('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));
    return {
      dataTestIdsSample: testIds.slice(0, 40),
      domPreview: document.body?.innerHTML?.slice(0, 4000) ?? null,
    };
  });
  const result = {
    reachedWorkbench,
    finalUrl: page.url(),
    finalTitle: await page.title(),
    bootstrapUrl,
    steps,
    bodyText,
    pageErrors,
    consoleErrors,
    failedRequests,
    failedGraphqlOperations,
    failedRequestsOnWorkbenchRoute,
    failedGraphqlOperationsOnWorkbenchRoute,
    workbenchSurface,
    domDiagnostics,
    onboardingStatusBefore,
    onboardingSkipAttempt,
    onboardingStatusAfter,
    screenshotPath: SCREENSHOT_OUTPUT,
  };
  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(result, null, 2), 'utf8');

  await browser.close();

  console.log(JSON.stringify(result, null, 2));
  if (!reachedWorkbench) {
    process.exitCode = 2;
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

