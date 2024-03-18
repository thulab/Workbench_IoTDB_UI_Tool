<template>
  <div class="custom-node-box">
    <el-icon :size="iconSize" class="m-b-6">
      <i-custom-graph-cluster v-if="type === 1" />
      <i-custom-graph-double-live v-else-if="type === 2" />
      <i-custom-graph-stand-alone v-else />
    </el-icon>
    <div class="custom-node-label-box">
      <text-tooltip :content="text" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CustomVueNode',
  inject: ['getNode'],
  data() {
    return {
      type: 0,
      text: '',
      iconSize: 72,
    };
  },
  mounted() {
    const node = (this as any).getNode();
    this.iconSize = node.data.iconSize || 72;
    node.on('change:data', ({ current }: any) => {
      const { iconSize } = current;
      this.iconSize = iconSize;
    });
    this.type = node.data.type;
    this.text = node.data.text;
  },
});
</script>

<style lang="scss" scoped>
.custom-node-box {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
}

.custom-node-label-box {
  display: flex;
  justify-content: center;
  text-align: center;
  font-size: 12px;
  line-height: 14px;
  color: #424561;
  position: absolute;
  width: 100%;
  left: 0;
  bottom: 0;

  // overflow: hidden;
  // white-space: nowrap;
  // text-overflow: ellipsis;
  // word-break: break-all;
}
</style>
