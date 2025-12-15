import type { TrendData } from '@/types/search';
import type { SelectedMeasurement } from '@/types/table-data';

export interface LineObj {
  path: string;
  color: string;
  width: number;
  checked?: boolean;
  disabled?: boolean;
  selectedMeasurement?: SelectedMeasurement;
}

export interface TableHistoryTrendResponse {
  normal: TrendData[];
  abnormal: string[];
  changeAuto: string[];
}

export type TimeRange = {
  start: number;
  end: number;
};

export interface RangeHandle {
  id: 'start' | 'end';
  x: number;
}
