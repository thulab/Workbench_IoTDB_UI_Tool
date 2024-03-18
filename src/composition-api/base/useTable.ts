/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, reactive, type Ref, ref } from 'vue';
import Validator from '@/utils/validator';
import { hasOwn } from '@/utils/index';
import useRequest from '@/composition-api/base/useRequest';

type Resp<T> = ApiResponse<T[] | TableResponse<T>>;

type BuildParams<P extends Array<any>> = (page: number, size: number) => P;
type ProcessResp<T> = (response: Resp<T>) => Resp<T>;
type ListGetter<T> = (data: Ref<T[] | TableResponse<T>>) => T[];
type ListSetter<T> = (data: T[]) => void;
type FnName = 'buildParams' | 'processResp' | 'listGetter' | 'listSetter';

interface Opt<P extends Array<any>, T> {
  initData: T[] | TableResponse<T>;
  /** 是否分页  默认 true 分页 */
  paging: boolean;
  /** 构造请求参数
   * 为了适配多参数和多类型的情况，所以设计成返回数组
   * 默认返回 [{page, size}] 或 []
   */
  buildParams: BuildParams<P>;
  /** 处理响应
   * 默认情况下不需要处理，除非后端返回的数据结构比较奇葩，或者业务场景比较特殊
   */
  processResp: ProcessResp<T>;
  /**
   * 当你传入 processResp 时， 理论上默认的 list computed 会报错
   * 所以你需要自行实现 listGetter 和 listSetter
   * 如果不涉及修改 list listSetter就不用传了
   */
  listGetter: ListGetter<T>;
  listSetter: ListSetter<T>;
}

export default function useTable<P extends Array<any>, T>(getList: (...params: P) => HttpResponseP<T[] | TableResponse<T>>, options?: Partial<Opt<P, T>>) {
  const { loading, data, error, requestFn } = useRequest(getList, {
    initData: options?.initData,
  });

  const pagination = reactive({
    currentPage: 1,
    pageSize: 20,
    total: 0,
  });

  const { paging = true } = options || {};

  // eslint-disable-next-line consistent-return
  function getDefaultFn(fnName: FnName) {
    if (options && options[fnName] && typeof options[fnName] === 'function') {
      return options[fnName];
    }
  }

  function buildParams(page: number, size: number): P {
    const defaultFn = getDefaultFn('buildParams') as BuildParams<P>;
    if (defaultFn) {
      return defaultFn(page, size);
    }
    if (paging) {
      return [{ page, size }] as any;
    }
    return [] as any;
  }

  function processResp(response: Resp<T>): Resp<T> {
    const defaultFn = getDefaultFn('processResp') as ProcessResp<T>;
    if (defaultFn) {
      return defaultFn(response);
    }
    if (paging) {
      const resp = response as ApiResponse<TableResponse<T>>;
      if (hasOwn(resp.data, 'totalCount')) {
        pagination.total = resp.data.totalCount as number;
      } else if (resp.data.hasNext as boolean) {
        pagination.total = pagination.pageSize * pagination.currentPage + 1;
      } else {
        pagination.total = 0;
      }
    }
    return response;
  }

  function listGetter(d: Ref<T[] | TableResponse<T>>): T[] {
    const defaultFn = getDefaultFn('listGetter') as ListGetter<T>;
    if (defaultFn) {
      return defaultFn(d);
    }
    if (data.value) {
      if (paging) {
        return ((data.value as TableResponse<T>).content || (data.value as TableResponse<T>).dataList) as T[];
      }
      return data.value as T[];
    }
    return [];
  }

  function listSetter(val: T[]) {
    const defaultFn = getDefaultFn('listGetter') as ListSetter<T>;
    if (defaultFn) {
      defaultFn(val);
    }

    if (data.value) {
      if (paging) {
        (data.value as TableResponse<T>).content = val;
      }
      (data.value as T[]) = val;
    }
  }

  const list = computed({
    get() {
      return listGetter(data);
    },
    set(val: T[]) {
      listSetter(val);
    },
  });

  const selectedList: Ref<T[]> = ref([]);

  function fetchList(page?: number): Promise<Resp<T>> {
    let params: any = [];
    if (paging) {
      const p = (Validator.isNumber(page) ? page : pagination.currentPage) as number;
      pagination.currentPage = p;
      params = [
        {
          page: pagination.currentPage - 1,
          size: pagination.pageSize,
        },
      ];
    }
    params = buildParams(pagination.currentPage, pagination.pageSize);
    return requestFn(...params).then(processResp);
  }

  function onChangePage(page: number): void {
    pagination.currentPage = page;
    fetchList(page);
  }

  function onChangePageSize(size: number) {
    pagination.pageSize = size;
    fetchList(pagination.currentPage);
  }

  function onSelectChange(selectedRowKeys: T[]): void {
    selectedList.value = selectedRowKeys;
  }

  return {
    loading,
    list,
    selectedList,
    data,
    error,
    pagination,
    fetchList,
    onChangePage,
    onChangePageSize,
    onSelectChange,
  };
}
