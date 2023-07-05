declare namespace Calculate{
  export interface CalculateItem {
    name: string;
    desc: string;
    measurement: string;
    expression?: string;
    display?: string;
    database?: string;
    value?: string;
    valueTime?: string;
  }

  export interface GetLastValueRes {
    value: string;
    time: string;
  }

  export interface GetListRes {
    list: CalculateItem[];
    totalCount: number;
    totalPage: number;
  }
}
