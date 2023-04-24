import { defineStore } from 'pinia';
import { ref } from 'vue';
import { SSOApi } from '@/api';

export const useLoginStore = defineStore('login', () => {
  const isLogin = ref(false);
  const enabledSSO = ref(false);
  const firstPageLoad = ref(true);
  const userInfo = ref({
    name: '',
    userId: '',
    urls: {},
  } as {
    name: string;
    userId: string;
    urls: Record<string, string>;
  });

  function getParam(name: string, defaultValue?: string) {
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');
      if (pair[0] === name) { return pair[1]; }
    }
    return (defaultValue === undefined ? null : defaultValue);
  }

  function getLoginInfo(back = '') {
    return SSOApi.getLoginInfo().then((res) => {
      if (res.data.code === '0') {
        if (res.headers.authorization) {
          localStorage.setItem('authorization', res.headers.authorization);
        }
        isLogin.value = true;
        userInfo.value = {
          name: res.data.data.name,
          userId: res.data.data.id,
          urls: res.data.data.urls,
        };
      }
    }).finally(() => {
      if (back) {
        window.location.href = back;
      }
    });
  }
  async function fetchIsLogin() {
    const back = getParam('back', '/') || '/';
    const ticket = getParam('ticket');
    if (ticket) {
      const tokenResp = await SSOApi.doLoginByTicket(ticket);
      if (tokenResp.data.data) {
        localStorage.setItem('authorization', tokenResp.data.data);
        return getLoginInfo(back);
      }
    }
    const enabledSSOResp = await SSOApi.enabledSSO();
    if (!enabledSSOResp.data.data) {
      return getLoginInfo();
    }
    enabledSSO.value = true;
    localStorage.setItem('enabledSSO', 'true');
    await SSOApi.isLogin().then((res) => {
      if (!res.data.data) {
        SSOApi.getSsoAuthUrl().then((res1) => {
          console.log(res1);
          if (res1.data.code === '0') {
            window.location.href = res1.data.data;
          }
        });
      }
      return getLoginInfo();
    });
    return Promise.reject();
  }

  async function logoutSSO() {
    await SSOApi.logout();
    window.location.reload();
  }

  return {
    fetchIsLogin, isLogin, userInfo, firstPageLoad, enabledSSO, logoutSSO,
  };
});

export default useLoginStore;
