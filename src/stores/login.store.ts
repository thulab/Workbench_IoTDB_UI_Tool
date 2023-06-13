import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLoginStore = defineStore('login', () => {
  const userInfo = ref({
    name: '',
    userId: '',
    urls: {},
  } as {
    name: string;
    userId: string;
    urls: Record<string, string>;
  });

  return {
    userInfo,
  };
});

export default useLoginStore;
