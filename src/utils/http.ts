/* eslint-disable prefer-promise-reject-errors */
import Axios, { type InternalAxiosRequestConfig } from 'axios';
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

function requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (!config.headers || !config.headers.background) {
    NProgress.start();
    requestCount += 1;
  }
  // if (config && config.headers) {
  //   config.headers.Authorization = localStorage.getItem('authorization') || '';
  // } else {
  //   config.headers = {
  //     Authorization: localStorage.getItem('authorization') || '',
  //   };
  // }
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
  const { success, code } = data;
  if (success || code === 0) {
    return Promise.resolve(response);
  }
  // 如果是下载文件，并且返回类型是正确的blob 直接返回
  if (response.headers['content-disposition']
      && response.headers['content-disposition'].indexOf('attachment') > -1
      && data instanceof Blob
      && data.type !== 'application/json') {
    return Promise.resolve(response);
  }
  const logined = sessionStorage.getItem('nologin') === '0';
  if (response.status === 403 || (response.status === 401 && logined)) {
    return ElMessageBox.alert('登录已失效，请重新登录', '提示', {
      confirmButtonText: '确定',
      type: 'error',
      showClose: false,
    }).finally(() => {
      window.location.href = '/login';
      sessionStorage.setItem('nologin', '1');
      return Promise.reject(response);
    });
  }
  if (response.status === 401) {
    window.location.href = '/login';
    sessionStorage.setItem('nologin', '1');
    return Promise.reject(response);
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
