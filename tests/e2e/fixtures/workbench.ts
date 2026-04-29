import { expect, type Page, type Route } from '@playwright/test';
import { uiTimeouts } from '../pages/selectors';

type MockMode = 'login' | 'authenticated';

type MockOptions = {
  entityPrivileges?: string[];
  pathPrivileges?: Array<{ path: string; privileges: string[] }>;
  dataSearchDelayMs?: number;
  sqlQueryDelayMs?: number;
  connectionTestMode?: 'default' | 'error';
  connectionTestErrorMessage?: string;
  dataSearchMode?: 'default' | 'empty' | 'error';
  dataSearchErrorMessage?: string;
  statisticResponseMessage?: string;
  statisticEmpty?: boolean;
  sqlQueryOverrides?: Record<
    string,
    {
      status?: boolean;
      errMsg?: string;
      queryTime?: string;
      metaDataList?: string[];
      valueList?: Array<Array<string | number>>;
    }
  >;
};

type SavedQuery = {
  id: number;
  queryName: string;
  sqls: string;
};

type MockConnectionDetail = ReturnType<typeof buildConnection>;

const appVersion = '2.3.1';
const pageReadyTimeout = process.env.PLAYWRIGHT_REAL_BACKEND === 'true' ? 60_000 : 30_000;
const enterpriseDbConfig = {
  host: '127.0.0.1',
  port: 6667,
  username: 'root',
  password: 'TimechoDB@2021',
};

function success<T>(data: T, message = 'success') {
  return {
    success: true,
    code: 0,
    message,
    data,
  };
}

async function fulfillJson(route: Route, payload: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

function parseRequestBody<T>(route: Route): Partial<T> {
  const body = route.request().postData();
  if (!body) return {};
  try {
    return JSON.parse(body) as T;
  } catch {
    return {};
  }
}

function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

function buildConnection() {
  return {
    id: 1,
    type: 0,
    name: 'E2E Connection',
    username: enterpriseDbConfig.username,
    password: enterpriseDbConfig.password,
    model: 'tree',
    useSsl: false,
    masterCluster: {
      hostAndPortVOS: [{ host: enterpriseDbConfig.host, port: enterpriseDbConfig.port }],
      prometheusUrl: '',
      prometheusUsername: '',
      prometheusPassword: '',
    },
    slaveCluster: null,
    trustStorePassword: '',
  };
}

function buildConnectionSummary(detail: MockConnectionDetail) {
  return {
    id: detail.id,
    type: detail.type,
    name: detail.name,
    username: detail.username,
    model: detail.model,
  };
}

function buildPrivileges(options: Pick<MockOptions, 'entityPrivileges' | 'pathPrivileges'> = {}) {
  return {
    userName: 'root',
    version: '2.0.8',
    slaveVersion: '',
    connection: buildConnection(),
    isMaster: true,
    isActive: true,
    model: 'tree',
    slaveIsConnection: false,
    enablePrometheus: true,
    configurePrometheus: true,
    entityPrivileges: options.entityPrivileges || ['SYSTEM', 'MANAGE_USER', 'WRITE_SCHEMA', 'READ_SCHEMA', 'READ_DATA', 'WRITE_DATA', 'USE_PIPE', 'USE_MODEL'],
    pathPrivileges: options.pathPrivileges || [],
    rolesToPrivileges: [],
    tableGlobalPrivileges: [],
    tableDataPrivileges: [],
  };
}

function buildPrivilegesEnum() {
  return {
    entityPrivileges: [],
    pathPrivileges: [],
  };
}

function buildSystemInfo() {
  return {
    active: true,
    dataNodeRatio: 1,
    configNodeRatio: 1,
    aiNodeRatio: 0,
    serverTime: Date.now(),
    databaseNum: 1,
    deviceNum: 2,
    measurementNum: 3,
    masterNodeInfo: {
      nodes: [
        {
          address: '127.0.0.1:10710',
          type: 'ConfigNode',
          status: 'Running',
          version: '2.0.8',
          physicalMachine: 'localhost',
        },
        {
          address: '127.0.0.1:10730',
          type: 'DataNode',
          status: 'Running',
          version: '2.0.8',
          physicalMachine: 'localhost',
        },
      ],
    },
    slaveNodeInfo: {
      nodes: [],
    },
  };
}

function buildDataSearchResult(measurement = 'root.sg.d1.s1', asc: 'asc' | 'desc' = 'asc') {
  const valueList = [
    [1713801600000, '42.5'],
    [1713801660000, '43.1'],
  ];

  return {
    status: true,
    queryTime: '12ms',
    metaDataList: ['Time', measurement],
    valueList: asc === 'desc' ? [...valueList].reverse() : valueList,
    hasNext: false,
    totalColumnPage: 1,
    totalColumnCount: 2,
  };
}

function buildEmptyDataSearchResult() {
  return {
    status: true,
    queryTime: '12ms',
    metaDataList: ['Time'],
    valueList: [],
    hasNext: false,
    totalColumnPage: 1,
    totalColumnCount: 1,
  };
}

function buildSqlQueryResult(sql = 'select * from root.sg.d1') {
  return {
    sql,
    status: true,
    queryTime: '8ms',
    metaDataList: ['Time', 'root.sg.d1.s1'],
    valueList: [
      [1713801600000, '42.5'],
      [1713801660000, '43.1'],
    ],
  };
}

function buildSqlQueryResultFromOverride(
  sql: string,
  override?: NonNullable<MockOptions['sqlQueryOverrides']>[string],
) {
  if (!override) {
    return buildSqlQueryResult(sql);
  }

  if (override.status === false) {
    return {
      sql,
      status: false,
      queryTime: override.queryTime || '8ms',
      errMsg: override.errMsg || 'Mock SQL error',
    };
  }

  const fallback = buildSqlQueryResult(sql);
  return {
    ...fallback,
    ...override,
    sql,
    status: override.status ?? true,
    metaDataList: override.metaDataList || fallback.metaDataList,
    valueList: override.valueList || fallback.valueList,
  };
}

export async function seedClientState(page: Page, options: { lang?: 'cn' | 'en'; appVersion?: string | null } = {}) {
  const lang = options.lang || 'en';
  const initialAppVersion = Object.prototype.hasOwnProperty.call(options, 'appVersion')
    ? options.appVersion
    : (process.env.PLAYWRIGHT_REAL_BACKEND === 'true' ? null : appVersion);

  await page.addInitScript(([version, initialLang]) => {
    if (version) {
      window.localStorage.setItem('appVersion', version);
    }
    window.localStorage.setItem('lang', initialLang);

    const trackedWindow = window as typeof window & {
      __openedUrls?: string[];
      __dataSearchRequests?: Array<Record<string, unknown>>;
      __sqlStopRequests?: number[];
      __sqlQueryRequests?: Array<Record<string, unknown>>;
    };
    trackedWindow.__openedUrls = [];
    trackedWindow.__dataSearchRequests = [];
    trackedWindow.__sqlStopRequests = [];
    trackedWindow.__sqlQueryRequests = [];
    trackedWindow.open = ((url?: string | URL) => {
      trackedWindow.__openedUrls?.push(url ? String(url) : '');
      return null;
    }) as typeof window.open;
  }, [initialAppVersion, lang] as const);
}

export async function seedSessionStorage(page: Page, key: string, value: unknown) {
  await page.addInitScript(
    ([storageKey, storageValue]) => {
      window.sessionStorage.setItem(storageKey, JSON.stringify(storageValue));
    },
    [key, value] as const,
  );
}

export async function mockWorkbenchApi(page: Page, mode: MockMode = 'login', options: MockOptions = {}) {
  const savedQueries: SavedQuery[] = [
    {
      id: 1001,
      queryName: 'Saved Query',
      sqls: 'select * from root.sg.d1;',
    },
  ];
  const connectionDetails = new Map<number, MockConnectionDetail>([[1, buildConnection()]]);

  const listConnections = () => [...connectionDetails.values()].map((item) => buildConnectionSummary(item));

  const getNextConnectionId = () => Math.max(...connectionDetails.keys(), 1000) + 1;

  const upsertConnection = (payload: Record<string, any>) => {
    const incomingId = payload.id ? Number(payload.id) : null;
    const connectionId = incomingId && connectionDetails.has(incomingId) ? incomingId : getNextConnectionId();
    const detail = cloneData(buildConnection());

    detail.id = connectionId;
    detail.type = Number(payload.type ?? 0) as 0 | 1 | 2;
    detail.name = payload.name || `Connection ${connectionId}`;
    detail.username = payload.username || enterpriseDbConfig.username;
    detail.password = payload.password || '';
    detail.model = payload.model || 'tree';
    detail.useSsl = !!payload.useSsl;
    detail.masterCluster = payload.masterCluster || detail.masterCluster;
    detail.slaveCluster = detail.type === 0 ? null : (payload.slaveCluster ?? null);
    detail.trustStorePassword = payload.trustStorePassword || '';

    connectionDetails.set(connectionId, detail);
    return connectionId;
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (!path.startsWith('/api/')) {
      await route.continue();
      return;
    }

    if (path === '/api/verifiable') {
      return fulfillJson(route, success(false));
    }

    if (path === '/api/connection/getConnectionList') {
      return fulfillJson(route, success(listConnections()));
    }

    if (path === '/api/connection/getConnectionById') {
      const connectionId = Number(url.searchParams.get('id'));
      return fulfillJson(route, success(cloneData(connectionDetails.get(connectionId) || buildConnection())));
    }

    if (path === '/api/connection/saveOrUpdateConnection' && request.method() === 'POST') {
      const payload = parseRequestBody<Record<string, any>>(route);
      return fulfillJson(route, success(upsertConnection(payload)));
    }

    if (path === '/api/connection/testConnection' && request.method() === 'POST') {
      if (options.connectionTestMode === 'error') {
        return fulfillJson(route, {
          success: false,
          code: 2000,
          message: options.connectionTestErrorMessage || '实例连接失败',
          data: null,
        });
      }
      return fulfillJson(route, success(null));
    }

    if (path === '/api/connection/updatePrometheus' && request.method() === 'POST') {
      return fulfillJson(route, success(null));
    }

    if (path === '/api/connection/testPrometheus' && request.method() === 'POST') {
      return fulfillJson(route, success(null));
    }

    if (path === '/api/connection/deleteConnectionById') {
      const connectionId = Number(url.searchParams.get('id'));
      connectionDetails.delete(connectionId);
      return fulfillJson(route, success(null));
    }

    if (path === '/api/loginAndSave' && request.method() === 'POST') {
      const payload = parseRequestBody<Record<string, any>>(route);
      return fulfillJson(route, success(upsertConnection(payload)));
    }

    if (path === '/api/changeModel') {
      return fulfillJson(route, success(null));
    }

    if (path === '/api/login' && request.method() === 'POST') {
      return fulfillJson(route, success(null));
    }

    if (mode === 'authenticated') {
      if (path === '/api/data/getDataByMeasurements' && request.method() === 'POST') {
        const payload = parseRequestBody<{ measurements?: string[]; asc?: 'asc' | 'desc' }>(route);
        await page.evaluate((requestPayload) => {
          const trackedWindow = window as typeof window & {
            __dataSearchRequests?: Array<Record<string, unknown>>;
          };
          trackedWindow.__dataSearchRequests?.push(requestPayload as Record<string, unknown>);
        }, payload);
        if (options.dataSearchDelayMs) {
          await new Promise((resolve) => setTimeout(resolve, options.dataSearchDelayMs));
        }
        if (options.dataSearchMode === 'error') {
          return fulfillJson(
            route,
            success({
              status: false,
              queryTime: '12ms',
              errMsg: options.dataSearchErrorMessage || 'Mock data-search error',
            }),
          );
        }
        if (options.dataSearchMode === 'empty') {
          return fulfillJson(route, success(buildEmptyDataSearchResult()));
        }
        if (!payload.measurements?.length) {
          return fulfillJson(route, success(buildEmptyDataSearchResult()));
        }
        return fulfillJson(route, success(buildDataSearchResult(payload.measurements?.[0], payload.asc || 'asc')));
      }

      if (path === '/api/query/querySql' && request.method() === 'POST') {
        const payload = parseRequestBody<{ sqls?: string[] }>(route);
        await page.evaluate((requestPayload) => {
          const trackedWindow = window as typeof window & {
            __sqlQueryRequests?: Array<Record<string, unknown>>;
          };
          trackedWindow.__sqlQueryRequests?.push(requestPayload as Record<string, unknown>);
        }, payload);
        if (options.sqlQueryDelayMs) {
          await new Promise((resolve) => setTimeout(resolve, options.sqlQueryDelayMs));
        }
        const results = (payload.sqls || ['select * from root.sg.d1']).map((sql) => buildSqlQueryResultFromOverride(sql, options.sqlQueryOverrides?.[sql]));
        return fulfillJson(route, success(results));
      }

      if (path === '/api/query/stop') {
        await page.evaluate(() => {
          const trackedWindow = window as typeof window & {
            __sqlStopRequests?: number[];
          };
          trackedWindow.__sqlStopRequests?.push(Date.now());
        });
        return fulfillJson(route, success(null));
      }

      if (path === '/api/query/query' && request.method() === 'GET') {
        const keyword = url.searchParams.get('keyword') || '';
        return fulfillJson(
          route,
          success(
            savedQueries
              .filter((item) => !keyword || item.queryName.toLowerCase().includes(keyword.toLowerCase()))
              .map((item) => ({
                id: item.id,
                queryName: item.queryName,
              })),
          ),
        );
      }

      if (path === '/api/query/query' && request.method() === 'POST') {
        const payload = parseRequestBody<{ id?: number | string | null; queryName?: string; sqls?: string }>(route);
        const incomingId = payload.id ? Number(payload.id) : null;

        if (incomingId) {
          const existing = savedQueries.find((item) => item.id === incomingId);
          if (existing) {
            existing.queryName = payload.queryName || existing.queryName;
            existing.sqls = payload.sqls || existing.sqls;
            return fulfillJson(route, success(existing.id));
          }
        }

        const nextId = Math.max(...savedQueries.map((item) => item.id), 1000) + 1;
        savedQueries.push({
          id: nextId,
          queryName: payload.queryName || `Query ${nextId}`,
          sqls: payload.sqls || '',
        });
        return fulfillJson(route, success(nextId));
      }

      if (path === '/api/query/query' && request.method() === 'DELETE') {
        const queryId = Number(url.searchParams.get('queryId'));
        const index = savedQueries.findIndex((item) => item.id === queryId);
        if (index >= 0) {
          savedQueries.splice(index, 1);
        }
        return fulfillJson(route, success(null));
      }

      if (path === '/api/query/queryById') {
        const queryId = Number(url.searchParams.get('queryId'));
        const matched = savedQueries.find((item) => item.id === queryId);
        return fulfillJson(
          route,
          success({
            sqls: matched?.sqls || 'select * from root.sg.d1;',
          }),
        );
      }

      if (path === '/api/schema/getDatabases') {
        return fulfillJson(
          route,
          success({
            pathNames: ['root.sg'],
          }),
        );
      }

      if (path === '/api/schema/getDevicesByGroupName') {
        return fulfillJson(
          route,
          success({
            pathNames: ['root.sg.d1'],
          }),
        );
      }

      if (path === '/api/schema/getMeasurementsByDeviceName') {
        return fulfillJson(
          route,
          success({
            pathNames: ['s1', 's2'],
          }),
        );
      }

      if (path === '/api/schema/getMeasurementsByFuzzyV2' || path === '/api/schema/getMeasurementsByDesc') {
        return fulfillJson(
          route,
          success({
            measurements: [
              { timeseries: 'root.sg.d1.s1', dataType: 'DOUBLE' },
              { timeseries: 'root.sg.d1.s2', dataType: 'INT64' },
            ],
          }),
        );
      }

      if (path === '/api/data/getStatisticalMaxMinValue' && request.method() === 'POST') {
        const payload = parseRequestBody<{ measurements?: string[] }>(route);
        return fulfillJson(
          route,
          success({
            data: options.statisticEmpty
              ? []
              : (payload.measurements || []).map((measurement) => ({
                  measurement,
                  minValue: '40.1',
                  minTime: '2024-04-23 00:00:00.000+08:00',
                  maxValue: '43.1',
                  maxTime: '2024-04-23 00:01:00.000+08:00',
                })),
            code: 0,
            message: options.statisticResponseMessage || '',
          }),
        );
      }

      if (path === '/api/data/getStatisticalAvgSumValue' && request.method() === 'POST') {
        const payload = parseRequestBody<{ measurements?: string[] }>(route);
        return fulfillJson(
          route,
          success({
            data: options.statisticEmpty
              ? []
              : (payload.measurements || []).map((measurement) => ({
                  measurement,
                  avgValue: '41.6',
                  sumValue: '83.2',
                  stddev: '1.5',
                  variance: '2.25',
                })),
            code: 0,
            message: options.statisticResponseMessage || '',
          }),
        );
      }

      if (path === '/api/file/dataGetExportId' && request.method() === 'POST') {
        return fulfillJson(route, success('data-export-1'));
      }

      if (path === '/api/file/statisticsGetExportId' && request.method() === 'POST') {
        return fulfillJson(route, success('statistics-export-1'));
      }

      if (path === '/api/file/exportSqlDataId' && request.method() === 'POST') {
        return fulfillJson(route, success('sql-export-1'));
      }

      if (path === '/api/file/upload' && request.method() === 'POST') {
        return fulfillJson(route, success('mock-import-file.csv'));
      }

      if ((path === '/api/file/importTsFile' || path === '/api/file/importDataCSVData' || path === '/api/file/importDataExcelData') && request.method() === 'POST') {
        return fulfillJson(
          route,
          success({
            filePath: '',
          }),
        );
      }

      if (path === '/api/privileges/getLoginUserPrivileges') {
        return fulfillJson(
          route,
          success(
            buildPrivileges({
              entityPrivileges: options.entityPrivileges,
              pathPrivileges: options.pathPrivileges,
            }),
          ),
        );
      }

      if (path === '/api/privileges/getPrivilegeConfig') {
        return fulfillJson(route, success(buildPrivilegesEnum()));
      }

      if (path === '/api/home/getSystemInfo') {
        return fulfillJson(route, success(buildSystemInfo()));
      }

      if (path === '/api/enum/get') {
        return fulfillJson(route, success({}));
      }

      if (path.startsWith('/api/home/')) {
        return fulfillJson(route, success([]));
      }
    }

    return fulfillJson(route, success(null));
  });
}

export async function gotoLogin(page: Page) {
  await page.goto('/view/login', { waitUntil: 'commit' });
  await expect(page.locator('[data-testid="login-page"], .login-wrapper').first()).toBeVisible({ timeout: pageReadyTimeout });
}

function loginConnectionSelect(page: Page) {
  return page.locator('[data-testid="login-connection"], #login-connection').first();
}

function loginUserInput(page: Page) {
  return page.locator('[data-testid="login-user"], #login-user').first();
}

function loginPasswordInput(page: Page) {
  return page.locator('[data-testid="login-password"], #login-pwd').first();
}

function loginSubmitButton(page: Page) {
  return page.locator('[data-testid="login-submit"], #login-submit').first();
}

function loginModelRadio(page: Page, model: 'tree' | 'table') {
  const selector = model === 'tree'
    ? '[data-testid="login-model-tree"], #connection-modal-type-0'
    : '[data-testid="login-model-table"], #connection-modal-type-1';
  return page.locator(selector).first();
}

export async function selectLoginConnection(page: Page, connectionName?: string) {
  await loginConnectionSelect(page).click({ force: true });

  const dropdown = page.locator('.el-select-dropdown').filter({
    has: page.locator('.el-select-dropdown__item'),
  }).last();
  await expect(dropdown).toBeVisible({ timeout: 10_000 });

  if (connectionName) {
    const namedOption = dropdown.locator('.el-select-dropdown__item').filter({ hasText: connectionName }).first();
    await expect(namedOption).toBeVisible({ timeout: 10_000 });
    await namedOption.click();
    return;
  }

  await dropdown.locator('.el-select-dropdown__item').first().click();
}

export async function loginThroughUi(
  page: Page,
  options: {
    connectionName?: string;
    username?: string;
    password?: string;
    model?: 'tree' | 'table';
  } = {},
) {
  await selectLoginConnection(page, options.connectionName);
  await loginUserInput(page).fill(options.username || enterpriseDbConfig.username);
  await loginPasswordInput(page).fill(options.password || enterpriseDbConfig.password);
  if (options.model) {
    await loginModelRadio(page, options.model).click();
  }
  await loginSubmitButton(page).click();
}

export async function gotoDataSearch(page: Page, measurement = 'root.sg.d1.s1') {
  await page.goto(`/view/search/data-search?measurement=${encodeURIComponent(measurement)}`, {
    waitUntil: 'commit',
  });
  await expect(page.locator('[data-testid="data-search-page"], #data-search-path, #data-search-search').first()).toBeVisible({ timeout: pageReadyTimeout });
}

export async function gotoSqlSearch(page: Page) {
  await page.goto('/view/sql/sql-search', { waitUntil: 'commit' });
  await expect(page.locator('[data-testid="sql-search-page"], #sql-search-operate-run, #sql-search-operate-save').first()).toBeVisible({ timeout: pageReadyTimeout });
}

export async function gotoStatisticSearch(page: Page) {
  await page.goto('/view/search/statistic-search', { waitUntil: 'commit' });
  await expect(page.locator('[data-testid="statistic-search-page"], #statistic-search-path, #statistic-search-search').first()).toBeVisible({ timeout: pageReadyTimeout });
}

export async function fillSqlEditor(page: Page, sql: string) {
  const updatedByView = await page.evaluate((content) => {
    const getActiveEditor = () =>
      [...document.querySelectorAll('[data-testid="sql-search-editor-input"], .cm-editor')].reverse().find((item) => {
        const element = item as HTMLElement;
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
      }) as TestableEditorElement | undefined;

    type TestableEditorElement = HTMLElement & {
      __cmView?: {
        state: {
          doc: { length: number };
        };
        dispatch(payload: {
          changes: { from: number; to: number; insert: string };
          selection: { anchor: number };
        }): void;
        focus(): void;
      };
    };

    const editor = getActiveEditor();
    if (!editor?.__cmView) {
      return false;
    }

    editor.__cmView.dispatch({
      changes: {
        from: 0,
        to: editor.__cmView.state.doc.length,
        insert: content,
      },
      selection: {
        anchor: content.length,
      },
    });
    editor.__cmView.focus();
    return true;
  }, sql);

  if (updatedByView) {
    return;
  }

  const contentEditable = page.locator('.cm-content[contenteditable="true"]').last();
  await expect(contentEditable).toBeVisible({ timeout: uiTimeouts.action });
  await contentEditable.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type(sql);
}

export async function selectSqlText(page: Page, text: string) {
  await page.evaluate((targetText) => {
    const getActiveEditor = () =>
      [...document.querySelectorAll('[data-testid="sql-search-editor-input"], .cm-editor')].reverse().find((item) => {
        const element = item as HTMLElement;
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
      }) as TestableEditorElement | undefined;

    type TestableEditorElement = HTMLElement & {
      __cmView?: {
        state: {
          doc: { toString(): string };
        };
        dispatch(payload: { selection: { anchor: number; head: number } }): void;
        focus(): void;
      };
    };

    const editor = getActiveEditor();
    if (!editor?.__cmView) {
      throw new Error('CodeMirror view is unavailable');
    }

    const fullText = editor.__cmView.state.doc.toString();
    const start = fullText.indexOf(targetText);
    if (start < 0) {
      throw new Error(`Selection text not found: ${targetText}`);
    }

    editor.__cmView.dispatch({
      selection: {
        anchor: start,
        head: start + targetText.length,
      },
    });
    editor.__cmView.focus();
  }, text);
}

export async function appendSqlText(page: Page, text: string) {
  const updatedByView = await page.evaluate((content) => {
    const getActiveEditor = () =>
      [...document.querySelectorAll('[data-testid="sql-search-editor-input"], .cm-editor')].reverse().find((item) => {
        const element = item as HTMLElement;
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
      }) as TestableEditorElement | undefined;

    type TestableEditorElement = HTMLElement & {
      __cmView?: {
        state: {
          doc: { length: number };
        };
        dispatch(payload: { changes: { from: number; insert: string }; selection: { anchor: number } }): void;
        focus(): void;
      };
    };

    const editor = getActiveEditor();
    if (!editor?.__cmView) {
      return false;
    }

    const end = editor.__cmView.state.doc.length;
    editor.__cmView.dispatch({
      changes: {
        from: end,
        insert: content,
      },
      selection: {
        anchor: end + content.length,
      },
    });
    editor.__cmView.focus();
    return true;
  }, text);

  if (updatedByView) {
    return;
  }

  const contentEditable = page.locator('.cm-content[contenteditable="true"]').last();
  await expect(contentEditable).toBeVisible({ timeout: uiTimeouts.action });
  await contentEditable.click();
  await page.keyboard.press('End');
  await page.keyboard.type(text);
}

export async function getActiveSqlEditorText(page: Page) {
  return page.evaluate(() => {
    type TestableEditorElement = HTMLElement & {
      __cmView?: {
        state: {
          doc: { toString(): string };
        };
      };
    };

    const editor = [...document.querySelectorAll('[data-testid="sql-search-editor-input"], .cm-editor')].reverse().find((item) => {
      const element = item as HTMLElement;
      return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }) as TestableEditorElement | undefined;

    if (editor?.__cmView?.state.doc) {
      return editor.__cmView.state.doc.toString();
    }

    const contentEditable = [...document.querySelectorAll('.cm-content[contenteditable="true"]')].reverse().find((item) => {
      const element = item as HTMLElement;
      return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }) as HTMLElement | undefined;

    return contentEditable?.textContent || '';
  });
}

export async function selectTimeseries(page: Page, prefix: string, measurement = 'root.sg.d1.s1') {
  const select = page.locator(`[data-testid="${prefix}-select"], #${prefix}`).first();
  await select.click();

  const inputTagName = await select.evaluate((element) => element.tagName.toLowerCase()).catch(() => '');
  const nestedInput = select.locator('input').last();
  const input = inputTagName === 'input' ? select : ((await nestedInput.count()) > 0 ? nestedInput : page.locator(`#${prefix}`).last());
  await expect(input).toBeVisible({ timeout: uiTimeouts.action });
  await input.fill(measurement);

  const optionTestId = `${prefix}-option-${measurement.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()}`;
  const optionByTestId = page.getByTestId(optionTestId);
  const optionByText = page.locator('.el-select-dropdown__item, .el-tree-node').filter({ hasText: measurement }).first();
  if (await optionByTestId.count()) {
    await expect(optionByTestId).toBeVisible({ timeout: 10_000 });
    await optionByTestId.click();
    return;
  }

  await expect(optionByText).toBeVisible({ timeout: 10_000 });
  await optionByText.click();
}

export async function openTimeseriesOptions(page: Page, prefix: string, query = 'root.sg.d1.s') {
  const select = page.locator(`[data-testid="${prefix}-select"], #${prefix}`).first();
  await select.click();

  const inputTagName = await select.evaluate((element) => element.tagName.toLowerCase()).catch(() => '');
  const nestedInput = select.locator('input').last();
  const input = inputTagName === 'input' ? select : ((await nestedInput.count()) > 0 ? nestedInput : page.locator(`#${prefix}`).last());
  await expect(input).toBeVisible({ timeout: uiTimeouts.action });
  await input.fill(query);

  const controls = page.locator(`[data-testid="${prefix}-controls"], .el-select-dropdown:visible, .el-popper:visible`).last();
  await expect(controls).toBeVisible({ timeout: 10_000 });
}

export async function getOpenedUrls(page: Page) {
  return page.evaluate(() => {
    const trackedWindow = window as typeof window & { __openedUrls?: string[] };
    return [...(trackedWindow.__openedUrls || [])];
  });
}

export async function getDataSearchRequests(page: Page) {
  return page.evaluate(() => {
    const trackedWindow = window as typeof window & {
      __dataSearchRequests?: Array<Record<string, unknown>>;
    };
    return [...(trackedWindow.__dataSearchRequests || [])];
  });
}

export async function getSqlStopRequests(page: Page) {
  return page.evaluate(() => {
    const trackedWindow = window as typeof window & {
      __sqlStopRequests?: number[];
    };
    return [...(trackedWindow.__sqlStopRequests || [])];
  });
}

export async function getSqlQueryRequests(page: Page) {
  return page.evaluate(() => {
    const trackedWindow = window as typeof window & {
      __sqlQueryRequests?: Array<Record<string, unknown>>;
    };
    return [...(trackedWindow.__sqlQueryRequests || [])];
  });
}
