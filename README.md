# vue3-vite-template

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## 开发环境

目前支持的开发环境如下：

- node 16.0.0 及以上
- npm 8.0.0 及以上
- 推荐使用 visual studio code

## 安装依赖

```
npm install
```

## 运行项目

```
npm run dev
```

## 运行单元测试

```
npm run test:unit
```

## 打包

```
npm run build
```

## 技术栈

**Vue3.0** + **Scss**(css modules) + **Element Plus** + **Eslint,Stylelint,Husky** 统一代码风格与规范。

## 代码规范

#### Javascript 规范

根据 eslint 约定规范，详见.eslintrc。

#### Css 规范

根据 stylelint 约定规范，详见.stylelintrc。

#### 代码格式风格规范

请 IDE 下载 Eslint 和 Stylelint 插件，配置保存文件时自动 fix。
<br/>