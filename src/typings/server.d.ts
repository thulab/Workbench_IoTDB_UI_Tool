declare namespace Server {
  export interface ConnectionInfo {
    name?: string;
    alias: string;
    username?: string;
    id: number;
    serverId?: string | number;
    rawid?: string | number;
    // 数据权限tree，展开树时获取
    dataPrivilege?: DbAuth.PreviewDataPrivilege;
    // 数据权限map，展开树时获取
    dataPrivilegeMap?: Record<string, string[]>;
    // 系统状态
    systemStatus: string;
    // 是否激活，展开树时获取
    active?: boolean;
    // 是否是企业版，展开树时获取
    enterprise?: boolean;
    // 版本号
    version?: string;
    // 截止日期，展开树时获取
    endDate?: string;
  }
}
