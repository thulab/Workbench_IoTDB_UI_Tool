/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __APP_BUILD_COMMIT__: string;
declare const __APP_BUILD_DATE__: string;

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_TITLE: string
  readonly CONFIG_API_PROXY: string;
  readonly VITE_APP_TYPE: string;
  readonly VITE_APP_PAGE_TITLE: string;
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
