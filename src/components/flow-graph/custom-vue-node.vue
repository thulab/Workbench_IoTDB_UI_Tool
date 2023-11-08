<template>
  <div class="custom-node-box">
    node
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CustomVueNode',
  inject: ['getNode'],
});
</script>

<style lang="scss" scoped>
.custom-node-box{
  position: relative;
}
</style>
