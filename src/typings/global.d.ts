import type { AxiosResponse } from 'axios';
import type { RouteRecordRaw } from 'vue-router';

declare global {

type TableResponse<T = any> = {
  current: number;
  size: number;
  total?: number;
  records: T[];
  hasNext?: boolean;
};

type ApiResponse<T = any> = {
  fail: boolean;
  success: boolean;
  result: T;
  code: string;
  message: string;
};

type HttpError = {
  code: string;
  message: string;
  [key: string]: any;
};

type HttpResponse<T = any> = AxiosResponse<ApiResponse<T>>;

type HttpResponseP<T = any> = Promise<HttpResponse<T>>;

type HttpTableResponse<T = any> = HttpResponse<TableResponse<T>>;

type HttpTableResponseP<T = any> = Promise<HttpTableResponse<T>>;

interface PageQuery {
  page?: number;
  pageSize?: number;
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
    isLink?: string;
    close?: boolean;
    order?: number;
    children?: MenuOptions[];
  }

  type CallBackFunction = (success: boolean) => void;

  interface Dict {
    // 分类编码
    categoryCode: string;
    // 分类说明
    categoryDesc: string;
    // 分类说明
    categoryDescEn: string;
    // 排序编号
    sortNo: number;
    // 数据类型
    dataType: string;
    // 附加说明
    remark: string;
    // 编码
    dictCode: string;
    // 名称
    dictDesc: string;
    // 名称
    dictDescEn: string;
    // 是否为默认值 0-不是 1-是
    selected: string;
    // 状态 0-禁用 1-启用
    state: string;
    // 具体类型
    items?: Array<Dict>;
  }
}
