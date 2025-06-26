/* eslint-disable prefer-promise-reject-errors */

import { createAlova } from 'alova';
import { axiosRequestAdapter } from '@alova/adapter-axios';
import VueHook from 'alova/vue';
import http from './http';

const http2 = createAlova({
  statesHook: VueHook, // VueHook / ReactHook / SvelteHook
  requestAdapter: axiosRequestAdapter({
    axios: http,
  }),
});

export default http2;

export { http2 };
