<template>
  <div v-bind="$attrs" class="monaco-container" ref="monacoContainer"></div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import editorLoader from './editor-loader';

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

const { locale } = useI18n();
const monacoEditor = ref<monaco.editor.IStandaloneCodeEditor>();
const monacoContainer = ref<HTMLElement>();

const initEditor = () => {
  if (monacoContainer.value) {
    editorLoader.config({
      'vs/nls': {
        availableLanguages: {
          '*': locale.value === 'zh-cn' ? 'zh-cn' : '',
        },
      },
    });
    editorLoader.init().then((monacoInstance) => {
      monacoEditor.value = monacoInstance.editor.create(monacoContainer.value!, {
        value: '',
        language: props.language,
        theme: props.theme,
        formatOnPaste: true,
        automaticLayout: true,
        fontSize: 12,
        lineHeight: 24,
        contextmenu: true,
        // wordBreak: 'keepAll',
        // defaultColorDecorators: true,
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
    });
  }
};

onMounted(() => {
  initEditor();
});

function getContent() {
  return toRaw(monacoEditor.value)?.getValue();
}

function setContent(val: string) {
  if (monacoEditor.value) {
    toRaw(monacoEditor.value!)?.setValue(val);
    monacoEditor.value!.getAction('editor.action.formatDocument')!.run();
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
