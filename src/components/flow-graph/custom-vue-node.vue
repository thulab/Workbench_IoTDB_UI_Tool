<template>
  <div class="custom-node-box">
    <el-icon size="60" class="m-b-6">
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
    };
  },
  mounted() {
    const node = (this as any).getNode();
    this.type = node.data.type;
    this.text = node.data.text;
  },
});
</script>

<style lang="scss" scoped>
.custom-node-box{
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
}

.custom-node-label-box{
  display: inline-grid;
  text-align: center;
  font-size: 12px;
  line-height: 14px;
  color: #424561;
  width: 100%;
}
</style>
