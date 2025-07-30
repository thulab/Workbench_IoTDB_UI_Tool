import { createAlova } from 'alova';
import { axiosRequestAdapter } from '@alova/adapter-axios';
import VueHook from 'alova/vue';
import http from './http';

const httpAlova = createAlova({
  statesHook: VueHook, // VueHook / ReactHook / SvelteHook
  requestAdapter: axiosRequestAdapter({
    axios: http,
  }),
});

export default httpAlova;

export { httpAlova };
