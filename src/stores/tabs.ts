import { defineStore } from 'pinia';
import type { TabPaneProps } from 'element-plus';
import router from '@/router';
import { HOME_URL, TABS_BLACK_LIST } from '@/config/app-config';

const useTabsStore = defineStore('tabsStore', {
  state: () => ({
    tabsMenuValue: HOME_URL,
    tabsMenuList: [
      {
        title: 'Home',
        path: HOME_URL,
        icon: 'home-filled',
        close: false,
      },
    ] as Array<globalThis.MenuOptions>,
  }),
  getters: {},
  actions: {
    async addTabs(tabItem: globalThis.MenuOptions, push: boolean = true) {
      if (TABS_BLACK_LIST.includes(tabItem.path)) return;
      const tabInfo: globalThis.MenuOptions = {
        title: tabItem.title,
        path: tabItem.path,
        close: tabItem.close,
      };
      if (this.tabsMenuList.every((item) => item.path !== tabItem.path)) {
        this.tabsMenuList.push(tabInfo);
      }
      this.setTabsMenuValue(tabItem.path);
      if (push) {
        router.push(tabItem.path);
      }
    },
    async removeTabs(tabPath: string) {
      let { tabsMenuValue } = this;
      const { tabsMenuList } = this;
      if (tabsMenuValue === tabPath) {
        tabsMenuList.forEach((item, index) => {
          if (item.path !== tabPath) return;
          const nextTab = tabsMenuList[index + 1] || tabsMenuList[index - 1];
          if (!nextTab) return;
          tabsMenuValue = nextTab.path;
          router.push(nextTab.path);
        });
      }
      this.tabsMenuValue = tabsMenuValue;
      this.tabsMenuList = tabsMenuList.filter((item) => item.path !== tabPath);
    },
    async changeTabs(tabItem: TabPaneProps) {
      this.tabsMenuList.forEach((item) => {
        if (item.title === tabItem.label) router.push(item.path);
      });
    },
    async setTabsMenuValue(tabsMenuValue: string) {
      this.tabsMenuValue = tabsMenuValue;
    },
    async setTabsMenuList(tabsMenuList: Array<globalThis.MenuOptions>) {
      this.tabsMenuList = tabsMenuList;
    },
    async closeMultipleTab(tabsMenuValue?: string) {
      this.tabsMenuList = this.tabsMenuList.filter((item) => item.path === tabsMenuValue || item.path === HOME_URL);
    },
    async goHome() {
      router.push(HOME_URL);
      this.tabsMenuValue = HOME_URL;
    },
  },
  persist: {
    storage: window.sessionStorage,
  },
});
export default useTabsStore;
