declare namespace Auth{

  export interface DBUser {
    name: string;
    password: string;
    isManager: 0 | 1;
  }
  export interface PrivilegeEnum {
    privileges: string;
    width: number;
  }

  export interface UserPrivileges {
    userName: string;
    entityPrivileges: string[];
    pathPrivileges: Record<string, string[]>;
    rolesToPrivileges: Array<{
      roleName: string;
      entityPrivileges: string[];
      pathPrivileges: Record<string, string[]>;
    }>
  }

  export interface PrivilegesEnum {
    entityPrivileges: Array<{ group: string, children: Auth.PrivilegeEnum[] }>;
    pathPrivileges: Array<{ group: string, children: Auth.PrivilegeEnum[] }>;
  }

  export interface UpdateAuthByRole {
    roleName: string;
    cancelEntityPrivileges: string[];
    addEntityPrivileges: string[];
    cancelPathPrivileges: Record<string, string[]>;
    addPathPrivileges: Record<string, string[]>;
  }

  export interface AuthByRoleRes {
    roleName: string;
    entityPrivileges: string[];
    pathPrivileges: Record<string, string[]>;
  }
  export interface UserAuthInfo extends UpdateAuthByRole {
    roleName?: string;
    userName: string;
    cancelRoles: string[];
    addRoles: string[];
  }
}
