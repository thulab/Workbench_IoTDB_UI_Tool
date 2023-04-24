/* eslint-disable @typescript-eslint/no-explicit-any */

import { ElMessage } from 'element-plus';
import { ref, type Ref } from 'vue';

interface Opt<T> {
  initData?: T;
  msg?: string;
  errMsg?: boolean | string;
}

export default function useRequest<Requests extends Array<any>, Resp>(
  apiFn: (...args: Requests) => HttpResponseP<Resp>,
  opt?: Opt<Resp>,
) {
  const options = {
    ...opt,
    errMsg: true,
  };
  const loading = ref(false);
  const data = ref(options.initData as Resp) as Ref<Resp>;
  const error = ref(null) as Ref<any>;

  function requestFn(...args: Requests): Promise<ApiResponse<Resp>> {
    loading.value = true;
    return apiFn(...args)
      .then((response) => {
        data.value = response.data.result;
        if (typeof options.msg === 'string') {
          ElMessage.success(options.msg);
        }
        return response.data;
      })
      .catch((err: HttpError) => {
        error.value = err;
        if (typeof options.errMsg === 'string') {
          ElMessage.error(options.errMsg);
        } else if (err.message) {
          ElMessage.error(err.message);
        }
        return Promise.reject(err);
      })
      .finally(() => {
        loading.value = false;
      });
  }

  return {
    loading,
    data,
    error,
    requestFn,
  };
}
