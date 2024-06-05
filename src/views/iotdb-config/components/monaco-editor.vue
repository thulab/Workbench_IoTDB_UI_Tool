<template>
  <div v-bind="$attrs" class="monaco-container" ref="monacoContainer"></div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

const props = withDefaults(
  defineProps<{
    language?: string;
    theme?: string;
    readOnly?: boolean;
  }>(),
  {
    language: 'shell',
    theme: 'vs',
    readOnly: false,
  }
);

// eslint-disable-next-line no-restricted-globals
(self as any).MonacoEnvironment = {
  getWorker(_: any, label: any) {
    if (label === 'json') {
      return new JsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new CssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new HtmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker();
    }
    return new EditorWorker();
  },
};

const monacoEditor = ref<monaco.editor.IStandaloneCodeEditor>();
const monacoContainer = ref<HTMLElement>();

const initEditor = () => {
  if (monacoContainer.value) {
    monacoEditor.value = monaco.editor.create(monacoContainer.value, {
      value: '',
      language: props.language,
      theme: props.theme,
      formatOnPaste: true,
      automaticLayout: true,
      fontSize: 12,
      lineHeight: 24,
      contextmenu: true,
      wordBreak: 'keepAll',
      defaultColorDecorators: true,
      scrollBeyondLastLine: false,
      // 默认加载不聚焦，设置false 初次渲染第一行会有光标聚焦样式，即有一圈边框。
      renderLineHighlightOnlyWhenFocus: true,
      scrollbar: {
        horizontalScrollbarSize: 4,
        verticalScrollbarSize: 4,
      },
      minimap: {
        enabled: false,
      },
      readOnly: props.readOnly,
    });
  } else {
    nextTick(() => {
      initEditor();
    });
  }
};

function getContent() {
  return toRaw(monacoEditor.value)?.getValue();
}

function setContent(val: string) {
  if (monacoEditor.value) {
    toRaw(monacoEditor.value!)?.setValue(val);
    monacoEditor.value!.getAction('editor.action.formatDocument')!.run();
  } else {
    nextTick(() => {
      setContent(val);
    });
  }
}

defineExpose({
  monacoEditor,
  initEditor,
  getContent,
  setContent,
});
</script>
<style lang="scss" scoped>
.monaco-container {
  width: 100%;
  height: 100%;
}
</style>
