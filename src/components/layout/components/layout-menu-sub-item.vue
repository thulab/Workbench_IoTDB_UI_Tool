<template>
  <template
    v-for="subItem in menus"
    :key="subItem.path">
    <el-sub-menu
      v-if="subItem.children && subItem.children.length > 0"
      :index="subItem.path">
      <template #title>
        <el-icon>
          <i v-html="subItem.icon"></i>
        </el-icon>
        <span>{{ subItem.title }}</span>
      </template>
      <layout-menu-sub-item :menu-list="subItem.children" />
    </el-sub-menu>
    <el-menu-item
      v-else
      :index="subItem.path">
      <el-icon>
        <i v-html="subItem.icon"></i>
      </el-icon>
      <template
        v-if="!subItem.isLink"
        #title>
        <span>{{ subItem.title }}</span>
      </template>
      <template
        v-else
        #title>
        <a
          class="href"
          :href="subItem.isLink"
          rel="noopener noreferrer"
          target="_blank">{{ subItem.title }}</a>
      </template>
    </el-menu-item>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ menuList: MenuOptions[] }>();

const menus = computed<MenuOptions[]>(() => {
  const { menuList } = props;
  menuList.sort((a, b) => ((a.order || 0) - (b.order || 0)));
  return menuList;
});

</script>

<style scoped lang="scss">
.el-menu-item {
  &.is-active {
    background-color: #060708 !important;
  }

  &.is-active::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    content: "";
    background: var(--el-color-primary);
  }
}

.el-menu--popup {
  .el-menu-item {
    background-color: #20222a;

    i {
      margin-right: 5px;
    }

    i,
    span {
      color: hsl(0deg 0% 100% / 70%);
    }

    &:hover {
      i,
      span {
        color: #fff !important;
      }
    }

    &.is-active {
      background-color: #060708 !important;

      &::before {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 4px;
        content: "";
        background: var(--el-color-primary);
      }

      i,
      span {
        color: #fff !important;
      }
    }
  }
}

.href {
  display: inline-block;
  width: 100%;
  height: 100%;
  color: #bdbdc0;
  text-decoration: none;
}
</style>
