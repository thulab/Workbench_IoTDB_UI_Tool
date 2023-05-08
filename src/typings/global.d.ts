import type { AxiosResponse } from 'axios';
import type { TableColumnCtx } from 'element-plus';

declare global {
  interface Window {
    __errBoxShowing__?: boolean;
    __echoTimer__?: number;
  }
  type TableResponse<T = any> = {
    pageNum?: number;
    pageSize?: number;
    totalCount?: number;
    totalPage?: number;
    pageCount?: number;
    content?: T[];
    dataList?: T[];
    hasNext?: boolean;
  };

  type ApiResponse<T = any> = {
    success: boolean;
    data: T;
    code: number;
    message: string;
  };

  type HttpError = {
    errCode: number;
    errMessage: string;
    message: string;
    code: number;
    [key: string]: any;
  };

  type HttpResponse<T = any> = AxiosResponse<ApiResponse<T>>;

  type HttpResponseP<T = any> = Promise<HttpResponse<T>>;

  type HttpTableResponse<T = any> = HttpResponse<TableResponse<T>>;

  type HttpTableResponseP<T = any> = Promise<HttpTableResponse<T>>;

  interface PageQuery {
    pageSize?: number;
    pageNum?: number;
  }

  interface RouteMeta {
    [key: string]: any;
    title?: string;
    hiddenMenu?: boolean; // 在菜单不显示，具有延续性
    abstract?: boolean; // 抽象路由，不能被激活，只能由子路由激活
    /**
       * 当只有一个子路由的时候，侧边栏会只显示子路由
       * 如果想一直在侧边栏显示父路由，则设置该属性为 true
       */
    alwaysShow?: boolean;
    permissions?: string[];
    requiresAuth?: boolean; // 是否需要权限验证
    hideClose?: boolean;
    label?: string,
    order?: number; // 菜单顺序
  }

  type RouteConfig = RouteRecordRaw & {
    name: string;
    path: string;
    component?: any;
    children?: RouteConfig[];
    meta: RouteMeta;
  };

  type Menu = RouteConfig & {
    name?: string;
    title?: string;
    path: string;
    meta: RouteMeta;
    alwayShow?: boolean;
    children?: Menu[];
    hasParent?: false;
  };

  interface MenuOptions {
    path: string;
    title: string;
    icon?: string;
    activeIcon?: string;
    isLink?: string;
    close?: boolean;
    order?: number;
    children?: MenuOptions[];
  }

  type CallBackFunction = (success: boolean) => void;

  interface SearchPageQuery extends PageQuery {
    keyword?: string | null;
  }

  type IotdbDataType = 'BOOLEAN' | 'INT32' | 'INT64' | 'FLOAT' | 'DOUBLE' | 'TEXT';

  interface DynamicTableColumn extends Partial<TableColumnCtx<Record<string, any>>> {
    label: string;
    prop: string;
    icon?: IotdbDataType | 'TIME';
    defaultValue?: string;
    formatHeader?: (label: string) => string;
    formatContent?: (content: string) => string;
  }
  interface DynamicFormItem {
    icon?: IotdbDataType | 'TIME';
    itemID: string;
    label: string;
    placeholder?: string;
    size?: string;
    type: 'RADIO' | 'INPUT';
    format?: Function;
    required?: boolean;
    disabled?: boolean;
  }
}
