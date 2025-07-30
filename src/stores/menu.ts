import { defineStore } from 'pinia';

const useMenuStore = defineStore('menuStore', {
  state: () => ({
    isCollapse: false,
    menuList: [] as Array<MenuOptions>,
  }),
  getters: {},
  actions: {
    async setCollapse() {
      this.isCollapse = !this.isCollapse;
    },
    async setMenuList(menuList: Array<MenuOptions>) {
      this.menuList = menuList;
    },
  },
  persist: true,
});

export default useMenuStore;
