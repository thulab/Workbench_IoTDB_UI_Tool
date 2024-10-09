import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';

import { defineConfig, loadEnv } from 'vite';
import Vue from '@vitejs/plugin-vue';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
// import VueDevTools from 'vite-plugin-vue-devtools';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import { execSync } from 'child_process';
import dayjs from 'dayjs';
import UnoCSS from 'unocss/vite';

function runGit(str: string) {
  return execSync(str).toString().replace('\n', '');
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const buildCommit = runGit('git rev-parse --short HEAD');
  const buildDate = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const env = loadEnv(mode, process.cwd(), 'CONFIG');
  const proxyTarget = env.CONFIG_API_PROXY || 'http://localhost:9090';
  const srcPath = fileURLToPath(new URL('./src', import.meta.url));
  return {
    define: {
      __APP_VERSION__: `'${process.env.npm_package_version}'`,
      __APP_BUILD_COMMIT__: `'${buildCommit}'`,
      __APP_BUILD_DATE__: `'${buildDate}'`,
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/styles/element/theme/index.scss" as *;',
          api: 'modern',
        },
      },
    },
    plugins: [
      Vue(),
      AutoImport({
        // Auto import functions from Vue, e.g. ref, reactive, toRef...
        // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
        // , '@vueuse/core'
        imports: [
          'vue',
          {
            '@vueuse/core': [
              // named imports
              'useVModel', // import { useVModel } from '@vueuse/core',
              'useDark',
              'useSessionStorage',
            ],
            'vue-i18n': ['useI18n'],
          },
        ],
        dirs: [resolve(srcPath, './composition-api')],
        resolvers: [
          // Auto import functions from Element Plus, e.g. ElMessage, ElMessageBox... (with style)
          // 自动导入 Element Plus 相关函数，如：ElMessage, ElMessageBox... (带样式)
          ElementPlusResolver({
            importStyle: 'sass',
          }),
          // Auto import icon components
          // 自动导入图标组件
          IconsResolver({
            prefix: 'Icon',
          }),
        ],
        dts: './src/typings/auto-imports.d.ts',
        // Generate corresponding .eslintrc-auto-import.json file.
        // eslint globals Docs - https://eslint.org/docs/user-guide/configuring/language-options#specifying-globals
        eslintrc: {
          enabled: true, // Default `false`
        },
      }),
      Components({
        resolvers: [
          // Auto register icon components
          // 自动注册图标组件
          IconsResolver({
            enabledCollections: ['ep'],
            customCollections: ['custom'],
          }),
          // Auto register Element Plus components
          // 自动导入 Element Plus 组件
          ElementPlusResolver({
            importStyle: 'sass',
          }),
        ],
        dts: './src/typings/components.d.ts',
      }),
      Icons({
        autoInstall: true,
        compiler: 'vue3',
        customCollections: { custom: FileSystemIconLoader('src/assets/icons') },
      }),
      VueI18nPlugin({
        /* options */
        // locale messages resource pre-compile option
        include: resolve(srcPath, './locale/lang/**'),
      }),
      // VueDevTools(),
      UnoCSS(),
    ],
    resolve: {
      alias: {
        '@': srcPath,
      },
    },
    optimizeDeps: {
      exclude: ['monaco-editor'],
    },
    server: {
      host: true,
      port: 8080,
      proxy: {
        '/api': {
          target: proxyTarget,
        },
        '/api/trendData': {
          target: proxyTarget,
          ws: true,
        },
      },
    },
  };
});
