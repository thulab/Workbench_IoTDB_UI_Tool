/* eslint-disable no-unused-vars */
declare namespace Trend {
  export interface LineObj {
    path: string;
    color: string;
    width: number;
    checked?: boolean;
    disabled?: boolean;
    selectedMeasurement?: IoTDB.SelectedMeasurement;
  }

  export interface TableHistoryTrendResponse {
    normal: Search.TrendData[];
    abnormal: string[];
    changeAuto: string[];
  }
}
