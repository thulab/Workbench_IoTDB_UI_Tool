/**
 *
 * @export
 * @interface DataPrivilegeVo
 */
export interface DataPrivilegeVo {
  /**
   * 范围
   * @type {string}
   * @memberof DataPrivilegeVo
   */
  scope?: string;
  /**
   * 角色
   * @type {string}
   * @memberof DataPrivilegeVo
   */
  role?: string;
  /**
   * 数据权限
   * @type {Array<SinglePrivilegeVo>}
   * @memberof DataPrivilegeVo
   */
  dataPrivileges?: Array<SinglePrivilegeVo>;
}

/**
 *
 * @export
 * @interface IoTDBUserAo
 */
export interface IoTDBUserAo {
  /**
   * 用户名
   * @type {string}
   * @memberof IoTDBUserAo
   */
  name?: string;
  /**
   * 密码
   * @type {string}
   * @memberof IoTDBUserAo
   */
  password?: string;
  /**
   * 原始密码
   * @type {string}
   * @memberof IoTDBUserAo
   */
  rawPassword?: string;
}
/**
 *
 * @export
 * @interface IoTDBUserVo
 */
export interface IoTDBUserVo {
  /**
   * 用户ID
   * @type {number}
   * @memberof IoTDBUserVo
   */
  userId?: number;
  /**
   * 用户名
   * @type {string}
   * @memberof IoTDBUserVo
   */
  name?: string;
  /**
   * 密码
   * @type {string}
   * @memberof IoTDBUserVo
   */
  password?: string;
  /**
   * 是否root用户
   * @type {number}
   * @memberof IoTDBUserVo
   */
  isManager?: number;
}

/**
 *
 * @export
 * @interface RelateUserWithRolesAo
 */
export interface RelateUserWithRolesAo {
  /**
   * 用户名
   * @type {string}
   * @memberof RelateUserWithRolesAo
   */
  userName?: string;
  /**
   * 绑定或解除绑定的角色名称列表
   * @type {Array<string>}
   * @memberof RelateUserWithRolesAo
   */
  relateRoles?: Array<string>;
}

/**
 *
 * @export
 * @interface SinglePrivilegeAo
 */
export interface SinglePrivilegeAo {
  /**
   * 权限名称
   * @type {string}
   * @memberof SinglePrivilegeAo
   */
  privilegeName?: string;
  /**
   * 是否有转授权限
   * @type {boolean}
   * @memberof SinglePrivilegeAo
   */
  grantOption?: boolean;
}

/**
 *
 * @export
 * @interface SinglePrivilegeVo
 */
export interface SinglePrivilegeVo {
  /**
   * 权限名称
   * @type {string}
   * @memberof SinglePrivilegeVo
   */
  privilegeName?: string;
  /**
   * 是否有转授权限
   * @type {boolean}
   * @memberof SinglePrivilegeVo
   */
  grantOption?: boolean;
  /**
   * 权限所属角色
   * @type {string}
   * @memberof SinglePrivilegeVo
   */
  role?: string;
}

/**
 *
 * @export
 * @interface UpdateDataPrivilegeAo
 */
export interface UpdateDataPrivilegeAo {
  /**
   * 用户名/角色名
   * @type {string}
   * @memberof UpdateDataPrivilegeAo
   */
  name?: string;
  /**
   * 数据权限变动的范围
   * @type {Array<string>}
   * @memberof UpdateDataPrivilegeAo
   */
  scopes?: Array<string>;
  /**
   * 授予的数据权限列表
   * @type {Array<SinglePrivilegeAo>}
   * @memberof UpdateDataPrivilegeAo
   */
  grantDataPrivileges?: Array<SinglePrivilegeAo>;
  /**
   * 撤销的数据权限列表
   * @type {Array<SinglePrivilegeAo>}
   * @memberof UpdateDataPrivilegeAo
   */
  revokeDataPrivileges?: Array<SinglePrivilegeAo>;
}

/**
 *
 * @export
 * @interface UpdateGlobalPrivilegeAo
 */
export interface UpdateGlobalPrivilegeAo {
  /**
   * 用户名/角色名
   * @type {string}
   * @memberof UpdateGlobalPrivilegeAo
   */
  name?: string;
  /**
   * 权限名称
   * @type {string}
   * @memberof UpdateGlobalPrivilegeAo
   */
  privilegeName?: string;
  /**
   * 是否有转授权限
   * @type {boolean}
   * @memberof UpdateGlobalPrivilegeAo
   */
  grantOption?: boolean;
}

export interface DataPrivilege {
  scope: string;
  role?: string;
  privileges?: string[];
  grantedPrivileges?: string[];
}
