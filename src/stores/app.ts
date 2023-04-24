import { defineStore } from 'pinia';

const useAppStore = defineStore('app', {
  state: () => ({
    systemTitle: import.meta.env.VITE_APP_TITLE, // 系统名称
    contentFullScreen: false, // 内容是否全屏展示
    showTabs: true,
    elementSize: 'default' as 'large' | 'default' | 'small', // element默认尺寸，支持 'large' | 'default' | 'small'
    routerViewLoading: false, // 路由视图加载状态
    AppVersion: __APP_VERSION__,
    AppBuildCommit: __APP_BUILD_COMMIT__,
    AppBuildDate: __APP_BUILD_DATE__,
  }),
  persist: false,
});

export default useAppStore;
