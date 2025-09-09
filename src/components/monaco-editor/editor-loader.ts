import loader from '@monaco-editor/loader';

// 完全依赖 public/assets/monaco/vs (monaco-editor/min) 静态资源；不再打包 ESM workers
// 不引入 runtime monaco 与 worker，避免重复体积；语言配置通过 loader.config 与组件内动态设置。

// Offline: point loader to locally copied 'vs' folder under public/assets/monaco/vs (prepared by script)
loader.config({
  paths: { vs: '/assets/monaco/vs' },
  'vs/nls': { availableLanguages: { '*': 'zh-cn' } },
});

export default loader;
