import { buildProps } from 'element-plus/es/utils/index';

export const VirtualizedTreeProps = buildProps({
  height: {
    type: Number,
  },
  width: {
    type: Number,
  },
} as const);

export default { VirtualizedTreeProps };
