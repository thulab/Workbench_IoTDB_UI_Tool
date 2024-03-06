import * as echarts from 'echarts/core';
import {
  LineChart, // 折线图
  type LineSeriesOption,
  BarChart, // 柱状图
  type BarSeriesOption,
  PieChart, // 饼图
  type PieSeriesOption,
  GaugeChart, // 仪表盘
  type GaugeSeriesOption,
  TreeChart, // 树图
  type TreeSeriesOption,
} from 'echarts/charts';
import {
  TitleComponent,
  // 组件类型的定义后缀都为 ComponentOption
  type TitleComponentOption,
  TooltipComponent,
  type TooltipComponentOption,
  ToolboxComponent,
  type ToolboxComponentOption,
  GridComponent,
  type GridComponentOption,
  LegendComponent,
  type LegendComponentOption,
  // 数据集组件
  DatasetComponent,
  type DatasetComponentOption,
  DataZoomComponent,
  type DataZoomComponentOption,
  // 内置数据转换器组件 (filter, sort)
  TransformComponent,
  MarkPointComponent,
  type MarkPointComponentOption,
  MarkLineComponent,
  type MarkLineComponentOption,
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';

// 通过 ComposeOption 来组合出一个只有必须组件和图表的 Option 类型
type ECOption = echarts.ComposeOption<
| LineSeriesOption
| BarSeriesOption
| PieSeriesOption
| GaugeSeriesOption
| TitleComponentOption
| TooltipComponentOption
| GridComponentOption
| DatasetComponentOption
| LegendComponentOption
| ToolboxComponentOption
| TreeSeriesOption
| DataZoomComponentOption
| MarkPointComponentOption
| MarkLineComponentOption
>;

// 注册必须的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  TransformComponent,
  ToolboxComponent,
  DataZoomComponent,
  MarkPointComponent,
  MarkLineComponent,
  GaugeChart,
  LineChart,
  BarChart,
  PieChart,
  TreeChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  SVGRenderer,
]);

export { type ECOption, echarts };
