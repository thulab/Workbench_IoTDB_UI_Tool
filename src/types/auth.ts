export interface DBUser {
  name: string;
  password: string;
  isManager: 0 | 1;
}
export interface PrivilegeEnum {
  privileges: string;
  width: number;
  desc: string;
}

export interface PrivilegesEnum {
  entityPrivileges: Array<{ group: string; children: PrivilegeEnum[] }>;
  pathPrivileges: Array<{ group: string; children: PrivilegeEnum[] }>;
}

interface AuthByRole {
  cancelEntityPrivileges: string[];
  addEntityPrivileges: string[];
  cancelPathPrivileges: Array<{ path: string; privileges: string[] }>;
  addPathPrivileges: Array<{ path: string; privileges: string[] }>;
}

export interface UpdateAuthByRole extends AuthByRole {
  roleName: string;
}

export interface UpdateRoleUsers {
  roleName: string;
  cancelUsers: string[];
  addUsers: string[];
}

export interface AuthByRoleRes {
  roleName: string;
  entityPrivileges: string[];
  pathPrivileges: Array<{ path: string; privileges: string[] }>;
}

export interface UserPrivileges {
  userName: string;
  enablePrometheus?: boolean;
  configurePrometheus?: boolean;
  entityPrivileges: string[];
  pathPrivileges: Array<{ path: string; privileges: string[] }>;
  rolesToPrivileges: Array<AuthByRoleRes>;
}
export interface UserAuthInfo extends AuthByRole {
  roleName?: string;
  userName: string;
  cancelRoles: string[];
  addRoles: string[];
}
interface BaseAuthInfo {
  rolePrivileges: string[];
  allChecked: boolean;
  privileges: string[];
}
export interface UserEditAuthInfo extends BaseAuthInfo {
  userPrivileges: string[];
}
export interface UserEditPathAuthInfo extends BaseAuthInfo {
  userPrivileges?: string[];
  userSourceData: { path: string; privileges: string[] };
  path: string;
}
