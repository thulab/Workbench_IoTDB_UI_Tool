/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

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
  if (success || code === '0') {
    return Promise.resolve(response);
  }
  if (response.headers['content-disposition'] && response.headers['content-disposition'].indexOf('attachment') > -1) {
    return Promise.resolve(response);
  }
  if (code === 'USER-0009' && localStorage.getItem('enabledSSO') !== 'true') {
    window.location.href = '/login';
    return Promise.reject({});
  }
  if (code === 'SSO-0001') {
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
