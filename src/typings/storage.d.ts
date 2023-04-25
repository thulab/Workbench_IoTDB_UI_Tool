declare namespace Storage{

  export type EncodingType = 'RLE' | 'PLAIN' | 'TS_2DIFF' | 'GORILLA';
  export type CompressionType = 'UNCOMPRESSED' | 'SNAPPY' | 'LZ4' | 'GZIP';

  export interface MeasurementItem {
    alias: string;
    attributes: string[][];
    compression: CompressionType;
    dataCount: number;
    dataType: IotdbDataType;
    description: string;
    encoding: EncodingType;
    newValue: string;
    newValueTime?: string;
    tags: string[][];
    timeseries: string;
    display?: boolean;
    border?: boolean;
    namecopy?: boolean;
    seBorder?: boolean;
    changed?: boolean;
    isAdd?: boolean;
    deadband?: string;
    compdev?: number;
    compmintime?: number;
    compmaxtime?: number;
  }

  export interface MeasurementResult {
    totalCount: number;
    totalPage: number;
    measurementVOList: Partial<MeasurementItem>[];
  }
}