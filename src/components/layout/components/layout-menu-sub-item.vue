<template>
  <template
    v-for="subItem in menus"
    :key="subItem.path">
    <template v-if="subItem.children && subItem.children.length > 0">
      <el-divider />
      <el-sub-menu
        :index="subItem.path">
        <template #title>
          <el-icon v-if="subItem.icon">
            <i class="active" v-if="isCollapse && subItem.activeIcon" v-html="subItem.activeIcon"></i>
            <i class="normal" v-html="subItem.icon"></i>
          </el-icon>
          <span>{{ subItem.title }}</span>
        </template>
        <layout-menu-sub-item :menu-list="subItem.children" />
      </el-sub-menu>
    </template>

    <el-menu-item
      v-else
      :index="subItem.path">
      <el-icon v-if="subItem.icon">
        <i class="active" v-if="isCollapse && subItem.activeIcon" v-html="subItem.activeIcon"></i>
        <i class="normal" v-html="subItem.icon"></i>
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
import useMenuStore from '@/stores/menu';

const menuStore = useMenuStore();
const isCollapse = computed((): boolean => menuStore.isCollapse);

const props = defineProps<{ menuList: MenuOptions[] }>();

const menus = computed<MenuOptions[]>(() => {
  const { menuList } = props;
  menuList.sort((a, b) => ((a.order || 0) - (b.order || 0)));
  return menuList;
});

</script>

<style scoped lang="scss">
.el-sub-menu {
  .el-icon {
    font-size: 30px;
  }
}

.el-menu-item {
  .el-icon {
    font-size: 30px;
  }

  &.is-active {
    background-color: #f7f8fc !important;
  }

  &.is-active::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    content: "";
    border-radius: 0 4px 4px 0;
    background: var(--el-color-primary);
  }

  // &:hover {
  //   background-color: #f7f8fc !important;
  //   color: #131926;
  // }
}

.el-menu--popup {
  .el-menu-item {
    background-color: #fff;

    i {
      margin-right: 5px;
    }

    i,
    span {
      color: #131926;
    }

    &:hover {
      i,
      span {
        color: #131926 !important;
      }
    }

    &.is-active {
      background-color: #f7f8fc !important;

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
        color: #131926 !important;
      }
    }
  }
}

.active {
  display: none;
}

.el-menu--collapse {
  .el-menu-item {
    padding: 0;
    height: 30px;
    margin: 5px;
    border-radius: 4px;

    &.is-active {
      background-color: var(--el-color-primary) !important;

      .active{
        display: block;
      }

      .normal{
        display: none;
      }

      &::before{
        display: none
      }
    }
  }

  .el-sub-menu  {
    &.is-active{
      padding: 5px;

      .active{
        display: block;
      }

      .normal{
        display: none;
      }

      :deep(.el-sub-menu__title){
        width: 30px;
        height: 30px;
        padding: 0;
        background: var(--el-color-primary);
        border-radius: 4px;

        .el-icon{
          margin: 0 auto;
        }
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
