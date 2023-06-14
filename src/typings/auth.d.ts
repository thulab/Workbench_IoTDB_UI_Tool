declare namespace Auth{
  export interface PrivilegeEnum {
    privileges: string;
    width: number;
  }

  export interface LoginUserPrivileges {
    userName: string;
    entityPrivileges: string[];
    pathPrivileges: string[];
    rolesToPrivileges: {
      roleName: string;
      entityPrivileges: string[];
      pathPrivileges: string[];
    }
  }

  export interface PrivilegesEnum {
    entityPrivileges: Record<string, Auth.PrivilegeEnum[]>;
    pathPrivileges: Record<string, Auth.PrivilegeEnum[]>;
  }

  export interface UpdateAuthByRole {
    roleName: string;
    cancelEntityPrivileges: string[];
    addEntityPrivileges: string[];
    cancelPathPrivileges: Record<string, string[]>;
    addPathPrivileges: Record<string, string[]>;
  }
}
