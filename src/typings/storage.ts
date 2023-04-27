declare namespace Storage{
  export interface GetStorageListResponse {
    storageGroupNames: string[];
    totalCount: number;
  }

  export interface GetPathListResponse {
    pathNames: string[];
    totalCount: number;
  }
}