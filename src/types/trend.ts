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

export type ChartMarker = {
  id: string;
  label: string;
  color: string;
  timestamp: number;
};

export type GroupState = {
  id: string;
  measurementIds: string[];
};

export type DataPoint = {
  timestamp: number;
  value: number;
};

export type Measurement = {
  id: string;
  label: string;
  color: string;
  details: SelectedMeasurement;
  values: DataPoint[];
};

export type ChartGroupInput = {
  id: string;
  members: Measurement[];
};

export type MeasurementMarkerData = {
  name: string;
  x1: number;
  x2: number;
  x2_x1: number;
  y1: number;
  y2: number;
  y2_y1: number;
};
