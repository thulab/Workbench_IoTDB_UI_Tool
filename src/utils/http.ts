/* eslint-disable prefer-promise-reject-errors */
import Axios, { type AxiosRequestConfig } from 'axios';
import NProgress from '@/config/nprogress-config';

let requestCount = 0;

const http = Axios.create({
  baseURL: '/api',
  timeout: 150000,
  withCredentials: true,
  validateStatus(status) {
    return status >= 200 && status <= 500;
  },
});

function requestInterceptor(config: AxiosRequestConfig) {
  if (!config.headers || !config.headers.background) {
    NProgress.start();
    requestCount += 1;
  }
  if (config && config.headers) {
    config.headers.Authorization = localStorage.getItem('authorization') || '';
  } else {
    config.headers = {
      Authorization: localStorage.getItem('authorization') || '',
    };
  }
  return config;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function requestErrorInterceptor(error: any) {
  ElMessage.error(error);
  requestCount -= 1;
  return Promise.reject(error);
}

async function responseInterceptor(response: HttpResponse<object>) {
  requestCount -= 1;
  if (requestCount < 1) {
    NProgress.done();
  }
  // eslint-disable-next-line prefer-const
  let { data } = response;
  const { success, code, message } = data;
  if (success || code === 0) {
    return Promise.resolve(response);
  }
  if (response.headers['content-disposition'] && response.headers['content-disposition'].indexOf('attachment') > -1) {
    return Promise.resolve(response);
  }
  if (code === 1009 && localStorage.getItem('enabledSSO') !== 'true') {
    window.location.href = '/login';
    return Promise.reject({});
  }
  if (code === 1001) {
    window.location.href = `${message}?back=${window.location.href}`;
    return Promise.reject({});
  }
  return Promise.reject(data);
}

function responseErrorInterceptor(error: { isAxiosError?: boolean; message?: string }) {
  requestCount -= 1;
  if (requestCount < 1) {
    NProgress.done();
  }
  if (Axios.isCancel(error)) {
    return Promise.reject({ message: 'cancel request' });
  }
  // if (error.isAxiosError) {
  //   return Promise.reject(error);
  // }
  return Promise.reject(error);
}

http.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
http.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

export default http;
