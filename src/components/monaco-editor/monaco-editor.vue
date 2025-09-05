<template>
  <div class="monaco-container" ref="monacoContainer" v-loading="loading"></div>
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
  },
);

const monacoEditor = ref<monaco.editor.IStandaloneCodeEditor>();
const monacoContainer = ref<HTMLElement>();
const loading = ref(false);
const content = ref<string>('');
const emit = defineEmits(['mounted']);

const initEditor = () => {
  loading.value = true;
  // editorLoader.config({
  //   monaco: monacoAll,
  //   'vs/nls': {
  //     availableLanguages: {
  //       '*': locale.value === 'zh-cn' ? 'zh-cn' : '',
  //     },
  //   },
  // });
  editorLoader.init().then((monacoInstance) => {
    monacoEditor.value = monacoInstance.editor.create(monacoContainer.value!, {
      value: '',
      language: props.language,
      theme: props.theme,
      formatOnPaste: true,
      automaticLayout: true,
      fontSize: 12,
      lineHeight: 24,
      contextmenu: false,
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
    loading.value = false;
    toRaw(monacoEditor.value).setValue(content.value);
    monacoEditor.value.getAction('editor.action.formatDocument')!.run();
  });
};

onMounted(() => {
  content.value = '';
  initEditor();
  emit('mounted');
});

function getContent() {
  return toRaw(monacoEditor.value)?.getValue();
}

function setContent(val: string) {
  if (monacoEditor.value) {
    toRaw(monacoEditor.value)?.setValue(val);
    monacoEditor.value.getAction('editor.action.formatDocument')!.run();
  } else {
    content.value = val;
  }
}

function setScrollToButtom() {
  const editor = toRaw(monacoEditor.value);
  if (editor) {
    const height = editor.getContentHeight();
    editor.setScrollPosition({ scrollTop: height });
  }
}

defineExpose({
  monacoEditor,
  initEditor,
  getContent,
  setContent,
  setScrollToButtom,
});
</script>
<style lang="scss" scoped>
.monaco-container {
  width: 100%;
  height: 100%;
}
</style>
