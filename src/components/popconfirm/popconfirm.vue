<template>
  <el-tooltip
    ref="tooltipRef"
    trigger="click"
    effect="light"
    v-bind="$attrs"
    :popper-class="`${ns.namespace.value}-popover`"
    :popper-style="style"
    :teleported="teleported"
    :fallback-placements="['bottom', 'top', 'right', 'left']"
    :hide-after="hideAfter"
    :persistent="persistent"
  >
    <template #content>
      <div :class="ns.b()">
        <div :class="ns.e('main')">
          <el-icon v-if="!hideIcon && icon" :class="ns.e('icon')" :style="{ color: iconColor }">
            <component :is="icon" />
          </el-icon>
          {{ title }}
        </div>
        <div :class="ns.e('action')">
          <el-button size="small" :type="cancelButtonType === 'text' ? '' : cancelButtonType" :text="cancelButtonType === 'text'" @click="cancel" :id="cancelButtonId">
            {{ finalCancelButtonText }}
          </el-button>
          <el-button size="small" :type="confirmButtonType === 'text' ? '' : confirmButtonType" :text="confirmButtonType === 'text'" @click="confirm" :id="confirmButtonId">
            {{ finalConfirmButtonText }}
          </el-button>
        </div>
      </div>
    </template>
    <template v-if="$slots.reference">
      <slot name="reference"></slot>
    </template>
  </el-tooltip>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useNamespace } from 'element-plus/es/hooks/index';
import { addUnit } from 'element-plus/es/utils/index';
import type { TooltipInstance } from 'element-plus/es/components/tooltip';
import 'element-plus/theme-chalk/src/popconfirm.scss';
import 'element-plus/theme-chalk/src/popover.scss';
import { popconfirmEmits, popconfirmProps } from './popconfirm';

defineOptions({
  name: 'Popconfirm',
});

const props = defineProps(popconfirmProps);
const emit = defineEmits(popconfirmEmits);

const { t } = useI18n();
const ns = useNamespace('popconfirm');
const tooltipRef = ref<TooltipInstance>();

const hidePopper = () => {
  tooltipRef.value?.onClose?.();
};

const style = computed(() => ({
  width: addUnit(props.width),
}));

const confirm = (e: MouseEvent) => {
  emit('confirm', e);
  hidePopper();
};
const cancel = (e: MouseEvent) => {
  emit('cancel', e);
  hidePopper();
};

const finalConfirmButtonText = computed(() => props.confirmButtonText || t('common.confirm'));
const finalCancelButtonText = computed(() => props.cancelButtonText || t('common.cancel'));
</script>
