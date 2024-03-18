declare namespace Auth {
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
    entityPrivileges: Array<{ group: string; children: Auth.PrivilegeEnum[] }>;
    pathPrivileges: Array<{ group: string; children: Auth.PrivilegeEnum[] }>;
  }

  export interface UpdateAuthByRole {
    roleName: string;
    cancelEntityPrivileges: string[];
    addEntityPrivileges: string[];
    cancelPathPrivileges: Array<{ path: string; privileges: string[] }>;
    addPathPrivileges: Array<{ path: string; privileges: string[] }>;
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
  export interface UserAuthInfo extends UpdateAuthByRole {
    roleName?: string;
    userName: string;
    cancelRoles: string[];
    addRoles: string[];
  }
  export interface UserEditAuthInfo {
    userPrivileges: string[];
    rolePrivileges: string[];
    allChecked: boolean;
    privileges: string[];
  }
  export interface UserEditPathAuthInfo extends UserEditAuthInfo {
    userPrivileges?: string[];
    userSourceData: { path: string; privileges: string[] };
    path: string;
  }
}
