<template>
  <div class="custom-node-box">
    <div class="custom-node-label-box">
      <el-icon size="20" style="margin-right: 4px;">
        <i-custom-connection-cluster v-if="type === 1" />
        <i-custom-connection-double-live v-else-if="type === 2" />
        <i-custom-connection-stand-alone v-else />
      </el-icon>
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
  background-color: #5F95FF;
  color: #fff;
}

.custom-node-label-box{
  display: flex;
  flex-flow: row wrap;
  width: 50px;
}
</style>
