<template>
  <div class="font_fmiy" ref="codeContainerRef">
  </div>
</template>

<script lang="ts" setup>
import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { CSSProperties } from 'vue';
import {
  createEditorState, createEditorView, destroyEditorView, getEditorTools, events, EventKey,
} from '@/components/code-editor/code-mirror';
import { IOTDB_EXTENSIONS } from '@/components/code-editor/lang-iotdb';

const props = defineProps<{
  modelValue: string,
  style: CSSProperties,
}>();

const emit = defineEmits(events);

const config = shallowRef(({
  autofocus: true,
  disabled: false,
  indentWithTab: true,
  tabSize: 2,
  placeholder: '',
  autoDestroy: true,
  extensions: IOTDB_EXTENSIONS,
}));

const codeContainerRef = shallowRef<HTMLDivElement>();
const state = shallowRef<EditorState>();
const view = shallowRef<EditorView>();

// function onCmCodeChange(content: string) {
//   // coder.value.setValue(content);
//   // coder.value?.replaceSelection(content);
// }

const insertContent = (content: string) => {
  if (view.value!.state.selection && view.value!.state.selection.ranges && view.value!.state.selection.ranges.length > 0) {
    const { from, to } = view.value!.state.selection.ranges[0];
    view.value!.dispatch({
      changes: { from, to, insert: content },
      selection: { anchor: from + content.length },
    });
    codeContainerRef.value!.focus();
  }
};

defineExpose({
  insertContent,
});

onMounted(() => {
  state.value = createEditorState({
    doc: props.modelValue,
    // selection: config.value.selection,
    // The extensions are split into two parts, global and component prop.
    // Only the global part is initialized here.
    // The prop part is dynamically reconfigured after the component is mounted.
    extensions: config.value.extensions ?? [],
    onFocus: (viewUpdate) => emit(EventKey.Focus, viewUpdate),
    onBlur: (viewUpdate) => emit(EventKey.Blur, viewUpdate),
    onUpdate: (viewUpdate) => emit(EventKey.Update, viewUpdate),
    onChange: (newDoc, viewUpdate) => {
      if (newDoc !== props.modelValue) {
        emit(EventKey.Change, newDoc, viewUpdate);
        emit(EventKey.ModelUpdate, newDoc, viewUpdate);
      }
    },
  });

  view.value = createEditorView({
    state: state.value,
    parent: codeContainerRef.value!,
  });

  const editorTools = getEditorTools(view.value);
  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue !== editorTools.getDoc()) {
        editorTools.setDoc(newValue);
      }
    },
  );
  if (config.value.disabled) {
    editorTools.toggleDisabled(config.value.disabled);
  }
  if (config.value.indentWithTab) {
    editorTools.toggleIndentWithTab(config.value.indentWithTab);
  }
  editorTools.setTabSize(config.value.tabSize || 2);
  // editorTools.setPhrases(config.value.phrases || {});
  editorTools.setPlaceholder(config.value.placeholder || '');
  editorTools.setTheme();
  // watch prop.style
  watch(
    () => props.style,
    (style) => editorTools.setStyle(style),
    { immediate: true },
  );
  if (config.value.autofocus) {
    editorTools.focus();
  }

  emit(EventKey.Ready, {
    state: state.value!,
    view: view.value!,
    container: codeContainerRef.value!,
  });
});
onBeforeUnmount(() => {
  if (config.value.autoDestroy && view.value) {
    destroyEditorView(view.value);
  }
});

</script>
<style lang="scss">

/* stylelint-disable-next-line selector-class-pattern */
.ͼ4 .cm-line {
  caret-color: black !important;
}
</style>
