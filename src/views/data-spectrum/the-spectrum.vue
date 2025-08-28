<template>
  <el-container class="data-spectrum-wrapper">
    <el-header class="p-0" style="height: auto">
      <div class="search-form-box" style="margin-bottom: 18px" :style="{ marginBottom: searchFormData.method !== 'PATTERN_MATCH' ? '18px' : '14px' }">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
          <div class="m-b-16 flex-align-center" style="height: 36px" :style="{ marginBottom: searchFormData.method !== 'PATTERN_MATCH' ? '16px' : '12px !important' }">
            <base-form-item :label="`${t('spectrum.analysisMethod')}：`" prop="method" :label-width="locale === 'en' ? '' : '96px'" :rules="requiredRules">
              <template #label>
                {{ t('spectrum.analysisMethod') }}：
                <el-tooltip effect="light" placement="top" popper-class="tooltip-box-width">
                  <template #content>
                    <p style="color: #131926; font-weight: 300" v-html="t('spectrum.analysisMethodTip', { doc: methodDocLink })"></p>
                  </template>
                  <i-custom-question />
                </el-tooltip>
              </template>
              <el-select v-model="searchFormData.method" id="spectrum-search-method" style="width: 230px" :placeholder="t('spectrum.analysisMethodPlaceholder')" @change="handleChangeMethod">
                <el-option
                  v-for="item in methodOptions"
                  :key="item.functionName"
                  :label="item.name"
                  :value="item.functionName"
                  :id="`spectrum-search-method-${item.functionName}`"
                  :disabled="!item.enable"
                >
                  <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t('spectrum.analysisMethodNoneTip')" popper-class="tooltip-box-width" :disabled="item.enable">
                    {{ item.name }}
                  </el-tooltip>
                </el-option>
              </el-select>
            </base-form-item>
            <div class="search-method-params-box" v-if="searchFormData.method && searchFormData.method !== 'custom' && searchFormData.method !== 'PATTERN_MATCH'">
              <span class="params-title">{{ t('spectrum.paramsTitle') }}</span>
              <template v-if="searchFormData.method === 'FFT'">
                <base-form-item :label="`${t('spectrum.returnResult')}：`" prop="resultType">
                  <el-select v-model="searchFormData.resultType" :style="{ width: locale === 'en' ? '110px' : '84px' }" id="spectrum-search-resultType">
                    <el-option v-for="item in resultList" :key="item.value" :label="item.name" :value="item.value" :id="`spectrum-search-resultType-${item.value}`" />
                  </el-select>
                </base-form-item>
                <base-form-item :label="`${t('spectrum.compressParams')}：`" prop="compression" class="m-r-0">
                  <template #label>
                    {{ t('spectrum.compressParams') }}：
                    <el-tooltip effect="light" placement="top" popper-class="tooltip-box-width" :content="t('spectrum.compressParamsTip')"><i-custom-question /></el-tooltip>
                  </template>
                  <el-input
                    v-model="searchFormData.compression"
                    :style="{ width: locale === 'en' ? '150px' : '120px' }"
                    :placeholder="t('spectrum.compressParamsPlaceholder')"
                    id="spectrum-search-compression"
                    @change="handleInputCompression"
                  />
                </base-form-item>
              </template>
              <template v-if="searchFormData.method === 'ENVELOPE'">
                <base-form-item :label="`${t('spectrum.modulationFrequency')}：`" prop="frequency">
                  <el-input v-model.number="searchFormData.frequency" style="width: 120px" id="spectrum-search-frequency" @change="handleInputFrequency" />
                </base-form-item>
                <base-form-item :label="`${t('spectrum.expandingFold')}：`" prop="amplification" class="m-r-0">
                  <el-input v-model.number="searchFormData.amplification" style="width: 120px" id="spectrum-search-expandingFold" @change="handleInputAmplification" />
                </base-form-item>
              </template>
              <template v-if="searchFormData.method === 'DWT'">
                <ul class="search-data-list">
                  <li :class="['search-data-type', { 'search-data-active': dwtTab === 'type' }]" id="spectrum-search-dwt-tab-type" @click="handleDWTTab('type')">{{ t('spectrum.filterType') }}</li>
                  <li :class="['search-data-type', { 'search-data-active': dwtTab === 'number' }]" id="spectrum-search-dwt-tab-number" @click="handleDWTTab('number')">
                    {{ t('spectrum.filterCoefficient') }}
                  </li>
                </ul>
                <base-form-item label="" prop="dwtMethod" v-if="dwtTab === 'type'">
                  <el-select
                    v-model="searchFormData.dwtMethod"
                    :style="{ width: locale === 'en' ? '110px' : '96px' }"
                    id="spectrum-search-dwt-method"
                    :placeholder="t('spectrum.filterTypePlaceholder')"
                  >
                    <el-option v-for="item in dwtMethodList" :key="item.value" :label="item.name" :value="item.value" :id="`spectrum-search-dwt-method-${item.value}`" />
                  </el-select>
                </base-form-item>
                <base-form-item label="" prop="coef" v-if="dwtTab === 'number'">
                  <el-input v-model="searchFormData.coef" :style="{ width: locale === 'en' ? '110px' : '96px' }" id="spectrum-search-dwt-number" :placeholder="t('spectrum.paramsPlaceholder')" />
                </base-form-item>
                <base-form-item :label="`${t('spectrum.transformationNumbers')}：`" prop="layer" class="m-r-0">
                  <el-input
                    v-model.number="searchFormData.layer"
                    :style="{ width: locale === 'en' ? '110px' : '84px' }"
                    id="spectrum-search-dwt-layer"
                    :placeholder="t('spectrum.paramsPlaceholder')"
                    @change="handleInputLayer"
                  />
                </base-form-item>
              </template>
              <template v-if="['LOWPASS', 'HIGHPASS']!.includes(searchFormData.method)">
                <base-form-item prop="wpass" :rules="requiredRules" class="form-item-last">
                  <template #label>
                    {{ t('spectrum.cutoffFrequency') }}：
                    <el-tooltip effect="light" placement="top" popper-class="tooltip-box-width" :content="t('spectrum.cutoffFrequencyTip')"><i-custom-question /></el-tooltip>
                  </template>
                  <el-input
                    v-model="searchFormData.wpass"
                    :style="{ width: locale === 'en' ? '110px' : '96px' }"
                    id="spectrum-search-wpass"
                    :placeholder="t('spectrum.paramsPlaceholder')"
                    @change="handleInputWpass"
                  />
                </base-form-item>
              </template>
            </div>
            <div class="search-method-params-box" v-else-if="searchFormData.method === 'PATTERN_MATCH'">
              <base-form-item prop="measurement" :label-width="locale === 'en' ? '' : '110px'" :rules="requiredRules">
                <template #label>
                  {{ t('spectrum.pending') }}：
                  <el-tooltip effect="light" placement="top" popper-class="tooltip-box-width">
                    <template #content>
                      {{ t('common.searchTipLimit100') }}
                    </template>
                    <i-custom-question />
                  </el-tooltip>
                </template>
                <timeseries-select-single
                  id="spectrum-search-path"
                  v-model="searchFormData.measurement"
                  :selectWidth="230"
                  :itemWidth="200"
                  show-suffix
                  :disabled-path="disabledPathDTW"
                  @handle-change-path="handleChangePath"
                />
              </base-form-item>
              <base-form-item :label="`${t('common.datetimerange')}：`" prop="datetimerange" :rules="requiredRules" class="form-item-last">
                <el-date-picker
                  v-model="searchFormData.datetimerange"
                  type="datetimerange"
                  range-separator="-"
                  unlink-panels
                  :disabled-date="disabledDate"
                  :shortcuts="shortcutsDaterange"
                  :clearable="false"
                  :prefix-icon="ICustomCalender"
                  :start-placeholder="t('search.startTime')"
                  :end-placeholder="t('search.endTime')"
                  id="spectrum-search-datetimerange"
                  @change="handleChangeTime"
                />
              </base-form-item>
            </div>
          </div>
          <div class="search-form-row-box">
            <div v-if="searchFormData.method !== 'custom' && searchFormData.method !== 'PATTERN_MATCH'">
              <base-form-item prop="measurement" :label-width="locale === 'en' ? '' : '96px'" :rules="requiredRules">
                <template #label>
                  {{ t('measurement.measurementChoose') }}：
                  <el-tooltip effect="light" placement="top" popper-class="tooltip-box-width">
                    <template #content>
                      {{ t('common.searchTipLimit100') }}
                      <br />
                      {{ t('spectrum.dwtTip') }}
                    </template>
                    <i-custom-question />
                  </el-tooltip>
                </template>
                <timeseries-select-single
                  id="spectrum-search-path"
                  v-model="searchFormData.measurement"
                  :selectWidth="230"
                  :itemWidth="200"
                  show-suffix
                  :disabled-path="disabledPath"
                  @handle-change-path="handleChangePath"
                />
              </base-form-item>
              <base-form-item :label="`${t('common.datetimerange')}：`" prop="datetimerange" :rules="requiredRules" :class="[searchFormData.method === 'DWT' ? '' : 'form-item-last']">
                <el-date-picker
                  v-model="searchFormData.datetimerange"
                  type="datetimerange"
                  range-separator="-"
                  unlink-panels
                  :disabled-date="disabledDate"
                  :shortcuts="shortcutsDaterange"
                  :clearable="false"
                  :prefix-icon="ICustomCalender"
                  :start-placeholder="t('search.startTime')"
                  :end-placeholder="t('search.endTime')"
                  id="spectrum-search-datetimerange"
                  @change="handleChangeTime"
                />
              </base-form-item>
              <base-form-item :label="`${t('spectrum.dataCount')}：`" v-if="searchFormData.method === 'DWT'" class="m-r-0">
                {{ dataCount || dataCount === 0 ? dataCount : '-' }}
              </base-form-item>
            </div>
            <div v-else-if="searchFormData.method === 'PATTERN_MATCH'">
              <div class="search-method-params-box m-r-12" style="display: inline-block">
                <base-form-item
                  prop="measurement"
                  :label-width="locale === 'en' ? '' : '92px'"
                  :rules="requiredRules"
                  :style="{ marginRight: searchFormData.partModel === 'fileUpload' ? '0 !important' : '24px' }"
                >
                  <template #label>{{ t('spectrum.segment') }}：</template>
                  <ul class="switch-list">
                    <li
                      :class="['switch-type', { 'switch-active': searchFormData.partModel === 'existing' }]"
                      id="data-search-type-datetime"
                      @click="
                        () => {
                          searchFormData.partModel = 'existing';
                        }
                      "
                    >
                      {{ t('spectrum.existing') }}
                    </li>
                    <li
                      :class="['switch-type', { 'switch-active': searchFormData.partModel === 'fileUpload' }]"
                      id="data-search-type-datetimerange"
                      @click="
                        () => {
                          searchFormData.partModel = 'fileUpload';
                        }
                      "
                    >
                      {{ t('spectrum.fileUpload') }}
                    </li>
                  </ul>
                  <timeseries-select-single
                    v-if="searchFormData.partModel === 'existing'"
                    id="spectrum-search-path"
                    v-model="searchFormData.partSeries"
                    :selectWidth="230"
                    :itemWidth="200"
                    show-suffix
                    :disabled-path="disabledPathDTW"
                    @handle-change-path="handleChangePath"
                  />

                  <el-button type="primary" v-else @click="handleImport">
                    {{ t('spectrum.fileUpload') }}
                  </el-button>
                </base-form-item>
                <base-form-item v-if="searchFormData.partModel === 'existing'" :label="`${t('common.datetimerange')}：`" prop="datetimerange" :rules="requiredRules" class="form-item-last">
                  <el-date-picker
                    v-model="searchFormData.partDatetimerange"
                    type="datetimerange"
                    range-separator="-"
                    unlink-panels
                    :disabled-date="disabledDate"
                    :shortcuts="shortcutsDaterange"
                    :clearable="false"
                    :prefix-icon="ICustomCalender"
                    :start-placeholder="t('search.startTime')"
                    :end-placeholder="t('search.endTime')"
                    id="spectrum-search-datetimerange"
                    @change="handleChangeTime"
                  />
                </base-form-item>
              </div>
              <div style="display: inline-block">
                <el-button type="primary" :disabled="!partTimestamps.length" class="detail-part-icon" @click="handleDetailPart" id="detail-part">
                  <el-icon size="30"><i-custom-detail-eye /></el-icon>
                </el-button>
                <base-form-item :label="`${t('spectrum.distance')}：`" :rules="requiredRules" prop="distance" class="m-r-0 m-l-12">
                  <template #label>
                    {{ t('spectrum.distance') }}：
                    <el-tooltip effect="light" placement="top" popper-class="tooltip-box-width">
                      <template #content>
                        {{ t('spectrum.distanceTip') }}
                      </template>
                      <i-custom-question />
                    </el-tooltip>
                  </template>
                  <el-input
                    v-model="searchFormData.distance"
                    :style="{ width: locale === 'en' ? '110px' : '84px' }"
                    id="spectrum-search-distance"
                    :placeholder="t('spectrum.paramsPlaceholder')"
                    @change="handleInputDistance"
                  />
                </base-form-item>
              </div>
            </div>

            <div v-if="searchFormData.method === 'custom'">
              <base-form-item :label="`${t('spectrum.sqlInput')}：`" prop="sql" :label-width="locale === 'en' ? '' : '96px'" class="el-form-item-not-mandatory">
                <el-button type="primary" link id="spectrum-search-sql" style="text-decoration: underline" @click="handleSql">{{ t('search.sqlInput') }}</el-button>
              </base-form-item>
            </div>
            <div class="search-form-buttons" :style="{ marginBottom: searchFormData.method === 'PATTERN_MATCH' ? '4px' : '0' }">
              <el-button @click="handleReset" id="spectrum-search-reset">{{ t('common.reset') }}</el-button>
              <el-tooltip placement="top-start" effect="light" trigger="hover" :content="applyTip" :disabled="applyTipDisabled" popper-class="tooltip-box-width">
                <el-button :disabled="!applyTipDisabled" type="primary" @click="handleSearch()" id="spectrum-search-search">
                  {{ t('common.apply') }}
                </el-button>
              </el-tooltip>
              <el-button :disabled="saveTemplateDisabled" @click="handleSaveTemplate" id="spectrum-search-save-template">{{ t('common.save') }}</el-button>
            </div>
          </div>
        </el-form>
      </div>
    </el-header>
    <el-main class="p-0">
      <el-container class="chart-detail-wrapper">
        <el-main class="p-0" style="position: relative">
          <div ref="chartContainer" class="chart-container" :style="{ height: searchFormData.method === 'PATTERN_MATCH' ? 'calc(100%)' : 'calc(100% - 30px)' }" v-element-size="onResize"></div>
          <div class="flex-align-center" style="margin-top: 2px" v-if="searchFormData.method !== 'PATTERN_MATCH'">
            <el-button
              type="primary"
              :plain="clickedOperate !== 'cursor'"
              class="cursor-button"
              id="spectrum-cursor"
              style="height: 24px !important"
              :disabled="dataEmpty"
              :class="dataEmpty ? 'disable-cursor' : ''"
              @click="handleClickOperate('cursor')"
            >
              {{ t('spectrum.cursor') }}
            </el-button>
            <div class="chart-operate-box">
              <el-button
                type="primary"
                id="spectrum-harmonicFrequency"
                color="#00B3AA"
                :disabled="disableFrequency"
                :plain="clickedOperate !== 'frequency'"
                :class="disableFrequency ? 'disable-frequency' : ''"
                @click="handleClickOperate('frequency')"
              >
                {{ t('spectrum.harmonicFrequency') }}
              </el-button>
              <el-input-number
                v-model="harmonicFrequency"
                :min="1"
                :max="99"
                step-strictly
                id="spectrum-harmonicFrequency-input"
                :disabled="dataEmpty || drawedStatus.frequency"
                :controls="false"
                :value-on-clear="1"
              />
            </div>
            <div class="chart-operate-box">
              <el-button
                type="primary"
                :plain="clickedOperate !== 'sideband'"
                id="spectrum-sideband"
                color="#6738BD"
                :disabled="disableSideband"
                :class="disableSideband ? 'disable-sideband' : ''"
                @click="handleClickOperate('sideband')"
              >
                {{ t('spectrum.sideband') }}
              </el-button>
              <el-input-number v-model="sideband" :min="1" :max="99" step-strictly id="spectrum-sideband-input" :disabled="dataEmpty || drawedStatus.sideband" :controls="false" :value-on-clear="1" />
            </div>
            <el-tooltip effect="light" :content="t('common.clearAll')" placement="top" popper-class="tooltip-box-width">
              <el-button link :class="['cursor-button-clear', 'm-l-8', dataEmpty ? '' : 'svg-button-hover-color']" id="spectrum-cursor-clear" :disabled="dataEmpty" @click="() => handleEmptyOperate()">
                <el-icon size="18" color="#fff"><i-custom-delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </el-main>
        <el-aside width="350px" class="path-list-wrapper" style="display: flex; flex-direction: column">
          <el-tabs v-model="activeNameSide" stretch class="tabs-nav-aside">
            <el-tab-pane :label="searchFormData.method !== 'PATTERN_MATCH' ? t('dataTrend.pointAttribute') : t('spectrum.match')" name="point">
              <point-list-tab
                v-if="searchFormData.method !== 'PATTERN_MATCH'"
                :point-list="pointList"
                :point-line-data="pointLineData"
                :point-checked-data="pointCheckedData"
                @handleDelPoint="handleDelPoint"
              />
              <match-list-tab v-else v-model:model-value="matchList" @handle-check-change="handleCheckChange" @handle-save="handleSaveMatch" />
            </el-tab-pane>
            <el-tab-pane :label="t('dataTrend.commonTemplates')" class="p-t-16" name="template">
              <template-list-tab ref="templateListRef" :source="'spectrum'" @handle-operate="handleOperateTemplate" />
            </el-tab-pane>
          </el-tabs>
        </el-aside>
      </el-container>
    </el-main>

    <modal-sql v-model:visible="sqlVisible" :sql-value="sqlValue" @handleConfirm="handleConfirmSql" />

    <modal-template v-model:visible="templateVisible" :name-list="nameList" :source="'spectrum'" :save-loading="saveTemplateLoading" @handleSave="handleSaveSuccess" />

    <modal-template-rename
      v-model:visible="renameVisible"
      :old-name="renameData.name"
      :name-list="nameList"
      :source="'spectrum'"
      :save-loading="saveTemplateLoading"
      @handleSave="handleRenameSuccess"
    />
    <modal-import v-model:visible="importVisible" :data-type="searchFormData.measurementType" @handle-close="handleImportClose" />
    <dialog-chart v-if="copySearchFormData.method === 'PATTERN_MATCH'" v-model:visible="chartDialogVisible" :times="partTimestamps" :values="partValues" />
  </el-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import type { FormInstance, DateModelType } from 'element-plus';
import dayjs from 'dayjs';
import { debounce, cloneDeep } from 'lodash-es';
import { vElementSize } from '@vueuse/components';
import { SearchApi } from '@/api';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import { useUserStore } from '@/stores';
import ICustomCalender from '~icons/custom/calender.svg';
import ModalSql from './components/modal-sql.vue';
import PointListTab from './components/point-list-tab.vue';
import MatchListTab from './components/match-list-tab.vue';
import TemplateListTab from '../data-trend/components/template-list-tab.vue';
import ModalTemplate from '../data-trend/components/modal-template.vue';
import ModalTemplateRename from '../data-trend/components/modal-template-rename.vue';
import ModalImport from './components/modal-import.vue';
import DialogChart from './components/dialog-chart.vue';
import type { FunctionData, SpectrumData, MatchItem, MeasurementDataItem, TrendTemplate } from '@/types';

interface PointData {
  name: string;
  x: number;
  y: number | string;
  disabled: boolean;
  checked: boolean;
}

interface MarkPointLine {
  path: string;
  type: string;
  name: string;
  value: number;
  xAxis: number;
  yAxis: number;
  itemStyle: {
    color: string;

    borderColor: string;
    borderWidth: number;
  };
  label: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    formatter: string | Function;
    position: string;
    color: string;
  };
  lineStyle: {
    type: string | number[];
    color: string;
  };
}

const { t, locale } = useI18n();
const methodDocLink = computed(
  () =>
    `<a href="${locale.value === 'en' ? 'https://www.timecho.com/docs/UserGuide/latest/User-Manual/Database-Programming.html#udtf-user-defined-timeseries-generating-function' : 'https://www.timecho.com/docs/zh/UserGuide/latest/User-Manual/Database-Programming.html#udtf-user-defined-timeseries-generating-function'}" target="_blank" rel="noopener noreferrer" style="color: #495ad4;"> ${t('common.userManual')}</a>`,
);
const userStore = useUserStore();
const { canReadWriteData } = storeToRefs(userStore);
const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts;
const methodList = ref<Array<FunctionData>>([]);
const dwtTab = ref<'type' | 'number'>('type');
const searchFormRef = ref<FormInstance>();
const searchFormData = reactive<{
  measurement: string;
  measurementType: string;
  method: string;
  resultType: string;
  compression: string | number | undefined;
  frequency: string | number | undefined;
  amplification: string | number | undefined;
  datetimerange: [DateModelType, DateModelType] | [];
  dwtMethod: string;
  coef: string | undefined;
  layer: string | number | undefined;
  wpass: string | number | undefined;
  partModel: 'existing' | 'fileUpload';
  partSeries: string;
  partDatetimerange: [DateModelType, DateModelType] | [];
  times: string[];
  values: string[];
  distance: string | number | undefined;
}>({
  measurement: '',
  measurementType: '',
  method: '',
  resultType: 'abs',
  compression: '',
  frequency: '',
  amplification: 1,
  datetimerange: [],
  dwtMethod: '',
  coef: '',
  layer: 1,
  wpass: '',
  partModel: 'existing',
  partSeries: '',
  partDatetimerange: [],
  distance: '0',
  times: [],
  values: [],
});
let copySearchFormData = cloneDeep(searchFormData);
const { shortcutsDaterange } = useShortcutsDate();

const importVisible = ref(false);

const disabledDate = (time: number) => time < new Date('1970-1-1').getTime();
const resultList = computed<Array<{ name: string; value: string }>>(() => [
  { name: t('spectrum.real'), value: 'real' },
  { name: t('spectrum.imag'), value: 'imag' },
  { name: t('spectrum.abs'), value: 'abs' },
  { name: t('spectrum.angle'), value: 'angle' },
]);
const dwtMethodList = computed<Array<{ name: string; value: string }>>(() => [
  { name: 'Haar', value: 'Haar' },
  { name: 'DB4', value: 'DB4' },
  { name: 'DB6', value: 'DB6' },
  { name: 'DB8', value: 'DB8' },
]);
const chartData = reactive<SpectrumData>({
  timestamps: [],
  values: [],
});
const dataCount = ref<undefined | null | number>();
const clickedOperate = ref<'cursor' | 'frequency' | 'sideband' | ''>('');
const markPointCount = ref(0);
const pointLineData = ref<Array<MarkPointLine>>([]);
const pointList = ref<Array<PointData>>([]);
const pointCheckedData = computed(() => pointList.value.filter((item) => item.checked));
const harmonicFrequency = ref<number | undefined>(1);
const frequencyInterval = ref<number | undefined>();
const sideband = ref<number | undefined>(1);
const sidebandData = ref<number[]>([]);
const sqlVisible = ref(false);
const sqlValue = ref('');
const clickedStatus = reactive({
  cursor: false,
  frequency: false,
  sideband: false,
});
const drawedStatus = reactive({
  frequency: false,
  sideband: false,
});
const requiredRules = ref([
  {
    required: true,
    message: '',
    trigger: 'blur',
  },
]);
let currentPoint = 0;
const templateVisible = ref(false);
const renameVisible = ref(false);
const renameData = reactive<{
  id: number | string;
  name: string;
  template: string;
}>({
  id: '',
  name: '',
  template: '',
});

const matchList = ref<MatchItem[]>([]);
const checkMatchList = ref<MatchItem[]>([]);

const partValues = ref<string[]>([]);
const partTimestamps = ref<number[]>([]);
const patternRawTimestamps = ref<number[]>([]);
const chartDialogVisible = ref(false);

const saveTemplateLoading = ref(false);
const activeNameSide = ref('point');
const templateListRef = ref<InstanceType<typeof TemplateListTab>>();
const nameList = computed(() => templateListRef.value?.templateList.map((item) => item.name) || []);
const dataEmpty = computed(() => chartData.timestamps.length === 0);
const disableFrequency = computed(() => chartData.timestamps.length === 0 || drawedStatus.frequency);
const disableSideband = computed(() => chartData.timestamps.length === 0 || drawedStatus.sideband);
const saveTemplateDisabled = computed(() => {
  if (!searchFormData.method) {
    return true;
  }
  if (searchFormData.method === 'ENVELOPE' && !searchFormData.measurement) {
    return true;
  }
  if ((searchFormData.method === 'DWT' && dwtTab.value === 'type' && !searchFormData.dwtMethod) || (dwtTab.value === 'number' && !searchFormData.coef)) {
    return true;
  }
  if (['LOWPASS', 'HIGHPASS']!.includes(searchFormData.method) && !searchFormData.wpass) {
    return true;
  }
  if (searchFormData.method === 'custom' && !sqlValue.value) {
    return true;
  }
  if (!searchFormData.measurement) {
    return true;
  }
  return false;
});

const applyTip = computed(() => {
  if (!canReadWriteData.value) {
    return t('common.dataAuth');
  }
  if (saveTemplateDisabled.value) {
    return t('spectrum.applyTip');
  }
  return '';
});

const applyTipDisabled = computed(() => {
  if (canReadWriteData.value && !saveTemplateDisabled.value) {
    return true;
  }
  return false;
});

const xMax = computed(() => chartData.timestamps[chartData.timestamps.length - 1]!);

const methodOptions = computed(() => [...methodList.value, { functionName: 'custom', name: t('spectrum.customAnalysis'), enable: true }]);

function disabledPath(item: MeasurementDataItem) {
  return item.dataType === 'BOOLEAN' || item.dataType === 'TEXT' || item.dataType === 'TIMESTAMP' || item.dataType === 'STRING' || item.dataType === 'BLOB' || item.dataType === 'DATE';
}
function disabledPathDTW(item: MeasurementDataItem) {
  return item.dataType === 'TEXT' || item.dataType === 'TIMESTAMP' || item.dataType === 'STRING' || item.dataType === 'BLOB' || item.dataType === 'DATE';
}

const seriesData = computed<ECOption>(
  () =>
    ({
      series: [
        {
          type: 'line',
          symbol: 'circle',
          showSymbol: false,
          showAllSymbol: 'auto',
          connectNulls: false,
          symbolSize: 4,
          name: copySearchFormData.measurement,
          data: chartData.values.map((dataItem, index) => [chartData.timestamps[index], dataItem]),
          markPoint: {
            silent: true,
            symbol: 'rect',
            symbolSize: 8,
            label: {
              show: false,
            },
            animation: false,
            data: pointLineData.value.length
              ? pointLineData.value.map((point) => ({ path: point.path, name: point.name, value: point.value, xAxis: point.xAxis, yAxis: point.yAxis, itemStyle: point.itemStyle, type: point.type }))
              : [],
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: pointLineData.value.length
              ? pointLineData.value.map((line) => ({ path: line.path, name: line.name, xAxis: line.xAxis, label: line.label, lineStyle: line.lineStyle, type: line.type }))
              : [],
            animation: false,
          },
          lineStyle: {
            width: 2,
            color: copySearchFormData.method === 'PATTERN_MATCH' ? undefined : '#4992ff',
          },
          itemStyle: {
            color: copySearchFormData.method === 'PATTERN_MATCH' ? undefined : '#4992ff',
          },
        },
      ],
    }) as unknown as ECOption,
);

const visualMap = computed(() => {
  if (copySearchFormData.method !== 'PATTERN_MATCH') {
    return undefined;
  }
  return {
    type: 'piecewise',
    show: false,
    dimension: 0,
    seriesIndex: 0,
    pieces: checkMatchList.value.map((item) => ({
      min: item.startTime,
      max: item.endTime,
    })),
    inRange: {
      color: '#FF6E76',
    },
    outOfRange: {
      color: '#4992ff',
    },
  };
});

const chartOptions = computed<ECOption>(
  () =>
    ({
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (params: Array<Record<string, any>>) => {
          const paramsData = params;
          const circle = `<div style="z-index: 9999"><span style="display:inline-block;margin-right:10px;border-radius:10px;width:10px;height:10px;background-color: ${paramsData[0]!.color}"></span><span style="font-size:14px;color:#666;font-weight:400;line-height:1;">${paramsData[0]!.seriesName}</span></div>`;
          const x = `<div style="margin: 10px 0 0;"><span style="font-size:14px;color:#666;font-weight:900;">X：</span><span style="font-size:14px;color:#666;font-weight:400;">${paramsData[0]!.axisValueLabel}</span></div>`;
          const y = `<div style="margin: 10px 0 0;"><span style="font-size:14px;color:#666;font-weight:900;">Y：</span><span style="font-size:14px;color:#666;font-weight:400;">${paramsData[0]!.value[1]}</span></div>`;
          return `${circle}${x}${y}`;
        },
      },
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            title: {
              zoom: t('common.zoom'),
              back: t('common.revoke'),
            },
            icon: {
              zoom: 'path://M15 9L23 9L23 23L9 23L9 15M13 9L9 9M9 9L5 9M9 13L9 9M9 9L9 5',
              back: 'path://M9,9h14v14H9v-8 M12,12L9,9l3-3',
            },
          },
          restore: {
            title: t('common.restore'),
            icon: 'path://M13 21L15 24C10.0294 24 6 19.9706 6 15C6 12.7036 6.86006 10.6081 8.27564 9.01797M17 9L15 6C19.9706 6 24 10.0294 24 15C24 17.3063 23.1325 19.4101 21.7059 21.0026',
          },
          saveAsImage: {
            title: t('common.export'),
            icon: 'path://M18,12V7H7v16h11v-5 M24,15H13 M21,18l3-3l-3-3',
          },
        },
      },
      grid: {
        left: 20,
        right: 60,
        bottom: 20,
        containLabel: true,
      },
      connectNulls: false,
      visualMap: visualMap.value,
      xAxis: {
        type: copySearchFormData.method === 'PATTERN_MATCH' ? 'time' : 'value',
        boundaryGap: false,
        show: !dataEmpty.value,
        splitLine: {
          show: false,
        },
        min: copySearchFormData.method === 'PATTERN_MATCH' ? 'dataMin' : 0,
        max: copySearchFormData.method === 'PATTERN_MATCH' ? 'dataMax' : xMax.value,
      },
      yAxis: {
        type: 'value',
        show: !dataEmpty.value,
        scale: true,
      },
      animation: true,
      series: seriesData.value.series,
    }) as unknown as ECOption,
);

const { requestFn: getUDFFunction } = useRequest(SearchApi.getUDFFunction);
const { requestFn: getFFTData } = useRequest(SearchApi.getFFTData);
const { requestFn: getEnvelopeDemodulationData } = useRequest(SearchApi.getEnvelopeDemodulationData);
const { requestFn: getDWTData } = useRequest(SearchApi.getDWTData);
const { requestFn: getPassData } = useRequest(SearchApi.getPassData);
const { requestFn: getDataCount } = useRequest(SearchApi.getDataCount);
const { requestFn: getCustomData } = useRequest(SearchApi.getCustomData);
const { requestFn: getPatternMatchData } = useRequest(SearchApi.getPatternMatchData);
const { requestFn: getExportMatchDataFile } = useRequest(SearchApi.getExportMatchDataFile);
const { requestFn: upsertTrendTemplate } = useRequest(SearchApi.upsertTrendTemplate);

function handleInputCompression(val: string) {
  if (val) {
    if (!/^[1]$|^0\.\d+$/.test(`${val}`)) {
      searchFormData.compression = undefined;
    }
  } else {
    searchFormData.compression = undefined;
  }
}

function handleInputLayer(val: string) {
  if (val) {
    if (!/^\+?[1-9][0-9]*$/.test(`${val}`)) {
      searchFormData.layer = undefined;
    }
  } else {
    searchFormData.layer = undefined;
  }
}
function handleInputDistance(val: string) {
  if (val || Number(val) === 0) {
    if (!/^(0|[1-9][0-9]*)(\.[0-9]+)?$|^0\.[0-9]+$/.test(`${val}`)) {
      searchFormData.distance = undefined;
    } else if (Number(val) < 0 || Number(val) > 100) {
      searchFormData.distance = undefined;
    }
  } else {
    searchFormData.distance = undefined;
  }
}

function handleInputWpass(val: string) {
  if (val) {
    if (!/^0\.\d+$/.test(`${val}`)) {
      searchFormData.wpass = undefined;
    }
  } else {
    searchFormData.wpass = undefined;
  }
}

function handleInputFrequency(val: string) {
  if (val) {
    if (!/^\+?[1-9][0-9]*$/.test(`${val}`)) {
      searchFormData.frequency = undefined;
    }
  } else {
    searchFormData.frequency = undefined;
  }
}

function handleInputAmplification(val: string) {
  if (val) {
    if (!/^\+?[1-9][0-9]*$/.test(`${val}`)) {
      searchFormData.amplification = undefined;
    }
  } else {
    searchFormData.amplification = undefined;
  }
}

// function handleInputHarmonicFrequency(val: string) {
//   if (val && !/^\+?[1-9][0-9]{0,1}$/.test(`${val}`)) {
//     harmonicFrequency.value = 1;
//   } else if (`${val}` === '0') {
//     harmonicFrequency.value = 1;
//   }
// }

// function handleInputSideband(val: string) {
//   if (val && !/^\+?[1-9][0-9]{0,1}$/.test(`${val}`)) {
//     sideband.value = 1;
//   } else if (`${val}` === '0') {
//     sideband.value = 1;
//   }
// }

function handleDWTTab(val: 'type' | 'number') {
  dwtTab.value = val;
}

function getCount() {
  const start = searchFormData.datetimerange.length === 2 ? dayjs(searchFormData.datetimerange[0]).valueOf() : undefined;
  const end = copySearchFormData.datetimerange.length === 2 ? dayjs(searchFormData.datetimerange[1]).valueOf() : undefined;
  getDataCount({
    measurement: searchFormData.measurement,
    startTime: start!,
    endTime: end!,
  })
    .then((res) => {
      dataCount.value = res.data;
    })
    .catch(() => {
      dataCount.value = undefined;
    });
}

function handleChangeMethod(val: string) {
  if (val === 'DWT' && searchFormData.measurement) {
    getCount();
  }
  if (val !== 'PATTERN_MATCH') {
    chartDialogVisible.value = false;
  } else {
    searchFormData.partModel = 'existing';
    if (partTimestamps.value.length) {
      chartDialogVisible.value = true;
    }
  }
}

function handleChangePath(val: string, data: MeasurementDataItem[]) {
  const current = data.find((f) => f.timeseries === val);
  searchFormData.measurementType = current?.dataType || '';
  if (searchFormData.method === 'DWT') {
    getCount();
  }
}

function handleChangeTime() {
  if (searchFormData.method === 'DWT' && searchFormData.measurement) {
    getCount();
  }
}

const setOption = (option: ECOption, noMerge: boolean = false) => {
  if (chartInstance) {
    // 实例存在直接设置
    chartInstance.setOption(option, noMerge);
  } else if (chartContainer.value && chartContainer.value.clientHeight) {
    // 实例不存在，容器存在，容器高度存在
    chartInstance = echarts.init(chartContainer.value, 'dark', {
      // useCoarsePointer: true,
    });
    // 若存在click事件，执行
    chartInstance.on('click', (params) => {
      if (!clickedOperate.value) return;

      handleClickChart(params);
    });
    chartInstance.on('highlight', (params: any) => {
      if (params.batch && params.batch.length > 0) currentPoint = params?.batch[0]!.dataIndex;
    });
    // 若存在restore事件，执行
    chartInstance.on('restore', () => {
      // handleEmptyOperate();
      setOption(chartOptions.value);
    });
    chartInstance.getZr().on('click', (params) => {
      if (!clickedOperate.value) return;
      if (params.target && !params.topTarget) {
        return;
      }
      // 点击到点上
      if ((params.target as unknown as any)?.z === 3 || (params.target as unknown as any)?.z === 5) {
        return;
      }
      if (params.topTarget && params.topTarget.type !== 'Line') return;
      if (currentPoint && chartData.timestamps[currentPoint]) {
        const point = [chartData.timestamps[currentPoint], chartData.values[currentPoint]];
        const param = { componentType: 'series', seriesName: copySearchFormData.measurement, value: point };

        handleClickChart(param as echarts.ECElementEvent);
      }
    });
    // 初次加载，设置notMerge为true
    chartInstance.setOption(option, true);
    chartInstance.setOption({
      xAxis: {
        show: false,
      },
    });
  } else {
    // 容器高度有问题时，延迟加载
    nextTick(() => {
      setOption(option);
    });
  }
};

function handleDealCursor(params: echarts.ECElementEvent) {
  const { seriesName, value, componentType } = params as { seriesName: string; value: number[] | number; componentType: string };
  let index = -1;
  // let pointName = '';
  if (componentType === 'series') {
    index = pointLineData.value.findIndex((data) => data.path === seriesName && data.xAxis === (value as number[])[0] && data.type === 'cursor');
    // pointName = `${seriesName}_${(value as number[])[0]}`;
  } else if (componentType === 'markPoint') {
    index = pointLineData.value.findIndex((data) => data.path === (params.data as unknown as any).path && data.value === value && data.type === 'cursor');
    // pointName = `${(params.data as unknown as any).path}_${value}`;
  } else {
    // 'markLine'
    index = pointLineData.value.findIndex((data) => data.path === (params.data as unknown as any).path && data.xAxis === value && data.type === 'cursor');
    // pointName = `${(params.data as unknown as any).path}_${value}`;
  }

  if (index !== -1) {
    // markPointCount.value--;
    // pointLineData.value.splice(index, 1);
    // pointLineData.value
    //   .filter((f) => f.type === 'cursor')
    //   .forEach((item, i) => {
    //     if (i >= index) {
    //       item.label = {
    //         formatter: () => (markPointCount.value === 1 ? 'D' : `D${i + 1}`),
    //         position: 'end',
    //         color: '#fff',
    //       };
    //     }
    //   });
    // const pointIndex = pointList.value.findIndex((point) => point.name === pointName);
    // if (pointIndex !== -1) {
    //   pointList.value.splice(pointIndex, 1);
    // }
    // setOption(chartOptions.value);
    return;
  }
  if (markPointCount.value > 9) {
    ElMessage.warning({
      message: t('spectrum.overTip'),
      grouping: true,
    });
    return;
  }
  markPointCount.value++;
  const num = markPointCount.value;
  pointLineData.value.push({
    path: seriesName,
    type: 'cursor',
    name: `${seriesName}_${(value as number[])[0]}_point_line`,
    value: (value as number[])[1]!,
    xAxis: (value as number[])[0]!,
    yAxis: (value as number[])[1]!,
    itemStyle: {
      color: 'transparent',
      borderColor: '#fff',
      borderWidth: 1,
    },
    label: {
      formatter: () => (markPointCount.value === 1 ? 'D' : `D${num}`),
      position: 'end',
      color: '#fff',
    },
    lineStyle: {
      type: [16, 10],
      color: '#DFE1ED',
    },
  });
  pointList.value.push({
    name: `${seriesName}_${(value as number[])[0]}`,
    x: (value as number[])[0]!,
    y: (value as number[])[1]!,
    disabled: false,
    checked: false,
  });
  setOption(chartOptions.value);
}

function handleDelPoint(data: PointData, index: number) {
  pointList.value.splice(index, 1);
  markPointCount.value--;
  const pointIndex = pointLineData.value.findIndex((point) => point.name === `${data.name}_point_line` && point.type === 'cursor');
  if (pointIndex !== -1) {
    pointLineData.value.splice(pointIndex, 1);
  }
  pointLineData.value
    .filter((f) => f.type === 'cursor')
    .forEach((item, i) => {
      if (i >= index) {
        item.label = {
          formatter: () => (markPointCount.value === 1 ? 'D' : `D${i + 1}`),
          position: 'end',
          color: '#fff',
        };
      }
    });
  setOption(chartOptions.value);
}

function handleDealFrequency(params: echarts.ECElementEvent) {
  const { seriesName, value } = params as { seriesName: string; value: number[] };
  frequencyInterval.value = value[0];
  if (!frequencyInterval.value) return;
  drawedStatus.frequency = true;
  for (let i = 1; i <= harmonicFrequency.value!; i++) {
    if (i * frequencyInterval.value <= xMax.value) {
      const x = i * frequencyInterval.value;
      let y = '';
      const index = chartData.timestamps.findIndex((num) => num === x);
      if (index !== -1) {
        y = chartData.values[index]!;
      }
      pointLineData.value.push({
        path: seriesName,
        type: 'frequency',
        name: `${seriesName}_${x}_frequency`,
        value: y as unknown as number,
        xAxis: x,
        yAxis: y as unknown as number,
        itemStyle: {
          color: 'transparent',
          borderColor: '#28D5CB',
          borderWidth: 1,
        },
        label: {
          formatter: `H${i === 1 ? '' : i}`,
          position: 'end',
          color: '#28D5CB',
        },
        lineStyle: {
          type: 'solid',
          color: '#28D5CB',
        },
      });
    }
  }
  setOption(chartOptions.value);
}

function handleDealSideband(params: echarts.ECElementEvent) {
  const { seriesName, value } = params as { seriesName: string; value: number[] };
  if (sidebandData.value.includes(value[0]!)) return;
  sidebandData.value.push(value[0]!);
  drawedStatus.sideband = true;
  if (sidebandData.value.length === 2) {
    const interval = Math.abs(sidebandData.value[0]! - sidebandData.value[1]!);
    // 左侧
    for (let i = 1; i <= sideband.value!; i++) {
      if (sidebandData.value[0]! - i * interval > 0) {
        const leftX = sidebandData.value[0]! - i * interval;
        let leftY = '';
        const leftI = chartData.timestamps.findIndex((num) => num === leftX);
        if (leftI !== -1) {
          leftY = chartData.values[leftI]!;
        }
        pointLineData.value.push({
          path: seriesName,
          type: 'sideband',
          name: `${seriesName}_${leftX}_sideband`,
          value: leftY as unknown as number,
          xAxis: leftX,
          yAxis: leftY as unknown as number,
          itemStyle: {
            color: 'transparent',
            borderColor: '#AA82F5',
            borderWidth: 1,
          },
          label: {
            formatter: `SL${i}`,
            position: 'end',
            color: '#AA82F5',
          },
          lineStyle: {
            type: 'solid',
            color: '#AA82F5',
          },
        });
      }
    }
    // 当前
    const currentX = sidebandData.value[0]!;
    let currentY = '';
    const currentI = chartData.timestamps.findIndex((num) => num === currentX);
    if (currentI !== -1) {
      currentY = chartData.values[currentI]!;
    }
    pointLineData.value.push({
      path: seriesName,
      type: 'sideband',
      name: `${seriesName}_${currentX}_sideband`,
      value: currentY as unknown as number,
      xAxis: currentX,
      yAxis: currentY as unknown as number,
      itemStyle: {
        color: 'transparent',
        borderColor: '#AA82F5',
        borderWidth: 1,
      },
      label: {
        formatter: 'S',
        position: 'end',
        color: '#AA82F5',
      },
      lineStyle: {
        type: 'solid',
        color: '#AA82F5',
      },
    });
    // 右侧
    for (let i = 1; i <= sideband.value!; i++) {
      if (sidebandData.value[0]! + i * interval <= xMax.value) {
        const rightX = sidebandData.value[0]! + i * interval;
        let rightY = '';
        const rightI = chartData.timestamps.findIndex((num) => num === rightX);
        if (rightI !== -1) {
          rightY = chartData.values[rightI]!;
        }
        pointLineData.value.push({
          path: seriesName,
          type: 'sideband',
          name: `${seriesName}_${rightX}_sideband`,
          value: rightY as unknown as number,
          xAxis: rightX,
          yAxis: rightY as unknown as number,
          itemStyle: {
            color: 'transparent',
            borderColor: '#AA82F5',
            borderWidth: 1,
          },
          label: {
            formatter: `SR${i}`,
            position: 'end',
            color: '#AA82F5',
          },
          lineStyle: {
            type: 'solid',
            color: '#AA82F5',
          },
        });
      }
    }
    setOption(chartOptions.value);
  }
}

function handleClickChart(params: echarts.ECElementEvent) {
  if (clickedOperate.value === 'cursor') {
    if (params.componentType !== 'series' && params.componentType !== 'markLine' && params.componentType !== 'markPoint') return;
    clickedStatus.cursor = true;
    handleDealCursor(params);
  } else if (clickedOperate.value === 'frequency') {
    if (params.componentType !== 'series') return;
    if (!harmonicFrequency.value) return;
    clickedStatus.frequency = true;
    if (frequencyInterval.value) return;
    handleDealFrequency(params);
  } else {
    if (params.componentType !== 'series') return;
    if (!sideband.value) return;
    clickedStatus.sideband = true;
    if (sidebandData.value.length === 2) return;
    handleDealSideband(params);
  }
}

function handleEmptyOperate(type?: 'cursor' | 'frequency' | 'sideband') {
  clickedOperate.value = type || '';
  markPointCount.value = 0;
  pointList.value = [];
  pointLineData.value = [];
  clickedStatus.cursor = false;
  clickedStatus.frequency = false;
  clickedStatus.sideband = false;
  drawedStatus.frequency = false;
  drawedStatus.sideband = false;
  harmonicFrequency.value = 1;
  sideband.value = 1;
  frequencyInterval.value = undefined;
  sidebandData.value = [];
  setOption(chartOptions.value);
}

function handleClickOperate(type: 'cursor' | 'frequency' | 'sideband') {
  if (clickedOperate.value === type) {
    clickedOperate.value = '';
    clickedStatus[type] = false;
    return;
  }
  clickedOperate.value = type;
  clickedStatus[type] = true;
}

const onResize = debounce(() => {
  if (chartContainer.value) {
    chartInstance?.resize();
  }
}, 50);

function getUdfList() {
  getUDFFunction().then((res) => {
    methodList.value = res.data || [];
  });
}

// 导入
function handleImport() {
  importVisible.value = true;
}
function handleDetailPart() {
  chartDialogVisible.value = !chartDialogVisible.value;
}

function handleImportClose(times: string[], values: string[]) {
  if (times && times.length) {
    searchFormData.times = times;
    searchFormData.values = values;
  }
}

// 重置
function handleReset() {
  searchFormData.measurement = '';
  searchFormData.method = '';
  searchFormData.resultType = 'abs';
  searchFormData.compression = '';
  searchFormData.frequency = '';
  searchFormData.amplification = 1;
  dwtTab.value = 'type';
  searchFormData.dwtMethod = '';
  searchFormData.coef = '';
  searchFormData.layer = 1;
  searchFormData.wpass = '';
  searchFormData.times = [];
  searchFormData.values = [];
  searchFormData.partDatetimerange = [];
  searchFormData.partModel = 'existing';
  searchFormData.partSeries = '';
  searchFormData.distance = '0';
  dataCount.value = undefined;
  sqlValue.value = '';
  searchFormData.datetimerange = [];
  copySearchFormData = cloneDeep(searchFormData);
  chartData.timestamps = [];
  chartData.values = [];
  handleEmptyOperate();
  setOption(chartOptions.value, true);
}

function getFFT() {
  const start = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[0]).valueOf() : undefined;
  const end = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[1]).valueOf() : undefined;
  getFFTData({
    resultType: copySearchFormData.resultType,
    compression: copySearchFormData.compression!,
    measurement: copySearchFormData.measurement,
    startTime: start,
    endTime: end,
  })
    .then((res) => {
      chartData.timestamps = res.data.timestamps || [];
      chartData.values = res.data.values || [];
      if (!chartData.timestamps.length) {
        ElMessage.warning({ message: t('dataTrend.noDataTip'), grouping: true });
      }
      setOption(chartOptions.value, true);
    })
    .catch(() => {
      chartData.timestamps = [];
      chartData.values = [];
      setOption(chartOptions.value, true);
    });
}

function getEnvelope() {
  const start = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[0]).valueOf() : undefined;
  const end = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[1]).valueOf() : undefined;
  getEnvelopeDemodulationData({
    frequency: copySearchFormData.frequency || '',
    amplification: copySearchFormData.amplification || '',
    measurement: copySearchFormData.measurement,
    startTime: start!,
    endTime: end!,
  })
    .then((res) => {
      chartData.timestamps = res.data.timestamps || [];
      chartData.values = res.data.values || [];
      if (!chartData.timestamps.length) {
        ElMessage.warning({ message: t('dataTrend.noDataTip'), grouping: true });
      }
      setOption(chartOptions.value, true);
    })
    .catch(() => {
      chartData.timestamps = [];
      chartData.values = [];
      setOption(chartOptions.value, true);
    });
}

function getDwt() {
  const start = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[0]).valueOf() : undefined;
  const end = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[1]).valueOf() : undefined;
  if (!copySearchFormData.layer) {
    searchFormData.layer = 1;
    copySearchFormData.layer = 1;
  }
  getDWTData({
    method: dwtTab.value === 'type' ? copySearchFormData.dwtMethod : '',
    coef: dwtTab.value === 'number' ? copySearchFormData.coef! : '',
    layer: copySearchFormData.layer || '',
    measurement: copySearchFormData.measurement,
    startTime: start!,
    endTime: end!,
  })
    .then((res) => {
      chartData.timestamps = res.data.timestamps || [];
      chartData.values = res.data.values || [];
      if (!chartData.timestamps.length) {
        ElMessage.warning({ message: t('dataTrend.noDataTip'), grouping: true });
      }
      setOption(chartOptions.value, true);
    })
    .catch(() => {
      chartData.timestamps = [];
      chartData.values = [];
      setOption(chartOptions.value, true);
    });
}

function getPass() {
  const start = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[0]).valueOf() : undefined;
  const end = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[1]).valueOf() : undefined;
  getPassData({
    udf: copySearchFormData.method === 'LOWPASS' ? 'low' : 'high',
    wpass: copySearchFormData.wpass || '',
    measurement: copySearchFormData.measurement,
    startTime: start!,
    endTime: end!,
  })
    .then((res) => {
      chartData.timestamps = res.data.timestamps || [];
      chartData.values = res.data.values || [];
      if (!chartData.timestamps.length) {
        ElMessage.warning({ message: t('dataTrend.noDataTip'), grouping: true });
      }
      setOption(chartOptions.value, true);
    })
    .catch(() => {
      chartData.timestamps = [];
      chartData.values = [];
      setOption(chartOptions.value, true);
    });
}

function getCustom() {
  getCustomData(sqlValue.value)
    .then((res) => {
      chartData.timestamps = res.data.timestamps || [];
      chartData.values = res.data.values || [];
      if (!chartData.timestamps.length) {
        ElMessage.warning({ message: t('dataTrend.noDataTip'), grouping: true });
      }
      setOption(chartOptions.value, true);
    })
    .catch(() => {
      chartData.timestamps = [];
      chartData.values = [];
      setOption(chartOptions.value, true);
    });
}

function getPatternMatch() {
  const start = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[0]).valueOf() : undefined;
  const end = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[1]).valueOf() : undefined;
  chartDialogVisible.value = false;
  getPatternMatchData({
    udf: 'pattern_match',
    patternSeries: copySearchFormData.measurement,
    patternStartTime: start!,
    patternEndTime: end!,
    threshold: 100 - Number(copySearchFormData.distance),
    times: copySearchFormData.partModel === 'fileUpload' ? copySearchFormData.times : undefined,
    values: copySearchFormData.partModel === 'fileUpload' ? copySearchFormData.values : undefined,
    partSeries: copySearchFormData.partModel === 'existing' ? copySearchFormData.partSeries : undefined,
    partStartTime: copySearchFormData.partModel === 'existing' && copySearchFormData.partDatetimerange.length === 2 ? dayjs(copySearchFormData.partDatetimerange[0]).valueOf() : undefined,
    partEndTime: copySearchFormData.partModel === 'existing' && copySearchFormData.partDatetimerange.length === 2 ? dayjs(copySearchFormData.partDatetimerange[1]).valueOf() : undefined,
  })
    .then((res) => {
      partTimestamps.value = res.data.partTimestamps || [];
      partValues.value = res.data.partValues || [];
      chartData.timestamps = res.data.patternTimestamps || [];
      patternRawTimestamps.value = res.data.patternRawTimestamps || [];
      chartData.values = res.data.patternValues || [];
      matchList.value = (res.data.matchValue || []).map((item) => ({ ...item, checked: false }));
      if (!chartData.timestamps.length) {
        ElMessage.warning({ message: t('dataTrend.noDataTip'), grouping: true });
      }
      if (partTimestamps.value.length) {
        chartDialogVisible.value = true;
      }
      setOption(chartOptions.value, true);
    })
    .catch(() => {
      chartData.timestamps = [];
      chartData.values = [];
      matchList.value = [];
      partTimestamps.value = [];
      partValues.value = [];
      setOption(chartOptions.value, true);
    });
}

// 查询
function handleSearch(unforce?: boolean) {
  if (!canReadWriteData.value) return;
  copySearchFormData = cloneDeep(searchFormData);
  if (!unforce) {
    handleEmptyOperate();
  }
  if (!copySearchFormData.method) {
    ElMessage.warning({
      message: t('spectrum.applyTip'),
      grouping: true,
    });
    return;
  }
  if (copySearchFormData.method === 'ENVELOPE') {
    if (!copySearchFormData.measurement) {
      ElMessage.warning({
        message: t('spectrum.applyTip'),
        grouping: true,
      });
      return;
    }
    getEnvelope();
  } else if (copySearchFormData.method === 'DWT') {
    if ((dwtTab.value === 'type' && !copySearchFormData.dwtMethod) || (dwtTab.value === 'number' && !copySearchFormData.coef)) {
      ElMessage.warning({
        message: t('spectrum.applyTip'),
        grouping: true,
      });
      return;
    }
    getDwt();
  } else if (['LOWPASS', 'HIGHPASS']!.includes(copySearchFormData.method)) {
    if (!copySearchFormData.wpass) {
      ElMessage.warning({
        message: t('spectrum.applyTip'),
        grouping: true,
      });
      return;
    }
    getPass();
  } else if (copySearchFormData.method === 'custom') {
    if (!sqlValue.value) {
      ElMessage.warning({
        message: t('spectrum.applyTip'),
        grouping: true,
      });
      return;
    }
    getCustom();
  } else if (copySearchFormData.method === 'PATTERN_MATCH') {
    if (
      (!copySearchFormData.distance && copySearchFormData.distance !== 0) ||
      !copySearchFormData.measurement ||
      (copySearchFormData.partModel === 'fileUpload' && !copySearchFormData.values.length) ||
      (copySearchFormData.partModel === 'existing' && !copySearchFormData.partSeries)
    ) {
      ElMessage.warning({
        message: t('spectrum.applyTip'),
        grouping: true,
      });
      return;
    }
    getPatternMatch();
  } else {
    if (!copySearchFormData.measurement) {
      ElMessage.warning({
        message: t('spectrum.applyTip'),
        grouping: true,
      });
      return;
    }
    getFFT();
  }
}

function handleSaveTemplate() {
  if (saveTemplateDisabled.value) return;
  saveTemplateLoading.value = false;
  templateVisible.value = true;
}

// 模板操作
function handleOperateTemplate(val: string, data: TrendTemplate) {
  if (val === 'rename') {
    renameData.id = +data.id;
    renameData.name = data.name;
    renameData.template = data.template;
    saveTemplateLoading.value = false;
    renameVisible.value = true;
  } else {
    const templateData = JSON.parse(data.template);
    searchFormData.measurement = templateData.measurement;
    searchFormData.measurementType = templateData.measurementType;
    searchFormData.method = templateData.method;
    searchFormData.resultType = templateData.resultType;
    searchFormData.compression = templateData.compression;
    searchFormData.frequency = templateData.frequency;
    searchFormData.amplification = templateData.amplification;
    searchFormData.datetimerange = templateData.datetimerange;
    searchFormData.dwtMethod = templateData.dwtMethod;
    searchFormData.coef = templateData.coef;
    searchFormData.layer = templateData.layer;
    searchFormData.wpass = templateData.wpass;
    searchFormData.partDatetimerange = templateData.partDatetimerange;
    searchFormData.partModel = templateData.partModel;
    searchFormData.partSeries = templateData.partSeries;
    searchFormData.distance = templateData.distance;
    dwtTab.value = templateData.dwtTab;
    if (searchFormData.measurement && searchFormData.method === 'DWT') {
      getCount();
    }
    handleSearch();
  }
}

function handleSaveSuccess(name: string) {
  saveTemplateLoading.value = true;
  const data = JSON.stringify({
    ...searchFormData,
    datetimerange: searchFormData.datetimerange.length === 2 ? [dayjs(searchFormData.datetimerange[0]).valueOf(), dayjs(searchFormData.datetimerange[1]).valueOf()] : [],
    dwtTab: dwtTab.value,
  });
  upsertTrendTemplate({
    id: '',
    type: 'spectrum',
    name,
    template: data,
  })
    .then(() => {
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      templateVisible.value = false;
      templateListRef.value?.getQueryList();
    })
    .finally(() => {
      saveTemplateLoading.value = false;
    });
}

function handleRenameSuccess(name: string) {
  saveTemplateLoading.value = true;
  upsertTrendTemplate({
    id: renameData.id,
    type: 'spectrum',
    name,
    template: renameData.template,
  })
    .then(() => {
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      renameVisible.value = false;
      templateListRef.value?.getQueryList();
    })
    .finally(() => {
      saveTemplateLoading.value = false;
    });
}

function handleSql() {
  sqlVisible.value = true;
}

function handleConfirmSql(val: string) {
  sqlValue.value = val;
}
function handleCheckChange(payload: MatchItem[]) {
  checkMatchList.value = payload;
  setOption(chartOptions.value);
  // if (checkMatchList.value.length === 1) {
  //   const { startTime, endTime } = checkMatchList.value[0];
  //   chartInstance.dispatchAction({
  //     type: 'dataZoom',
  //     startValue: startTime,
  //     endValue: endTime,
  //   });
  // } else {
  //   chartInstance.dispatchAction({
  //     type: 'dataZoom',
  //     start: 0,
  //     end: 100,
  //   });
  // }
}
function handleSaveMatch(times: MatchItem[]) {
  const saveTimes = [];
  const saveValues = [];
  for (let i = 0; i < chartData.timestamps.length; i++) {
    const timestamp = chartData.timestamps[i]!;
    const rawTimestamp = patternRawTimestamps.value[i]!;
    const value = chartData.values[i]!;

    if (times.some((item) => item.startTime <= timestamp && item.endTime >= timestamp)) {
      saveTimes.push(rawTimestamp);
      saveValues.push(value);
    }
  }
  getExportMatchDataFile(saveTimes, saveValues, copySearchFormData.measurement, copySearchFormData.measurementType).then((resp) => {
    const url = `/api/file/download/${resp.data}`;
    window.open(url);
  });
}

function setStorage() {
  window.sessionStorage.setItem(
    'dataSpectrumStorage',
    JSON.stringify({
      ...copySearchFormData,
      dwtTab: dwtTab.value,
      clickedOperate: clickedOperate.value,
      markPointCount: markPointCount.value,
      pointLineData: pointLineData.value,
      pointList: pointList.value,
      harmonicFrequency: harmonicFrequency.value,
      frequencyInterval: frequencyInterval.value,
      sideband: sideband.value,
      sidebandData: sidebandData.value,
      sqlValue: sqlValue.value,
      clickedStatus: { ...clickedStatus },
      drawedStatus: { ...drawedStatus },
      currentPoint,
    }),
  );
}

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    if (!window.__isReload__) {
      setStorage();
    } else {
      window.sessionStorage.setItem('dataSpectrumStorage', '');
    }
    chartContainer.value = null;
    if (chartInstance) {
      chartInstance.clear();
      chartInstance.dispose();
    }
  });
  getUdfList();
});

onBeforeUnmount(() => {
  setStorage();
});

onUnmounted(() => {
  chartContainer.value = null;
  if (chartInstance) {
    chartInstance.clear();
    chartInstance.dispose();
  }
});

watch(locale, () => {
  nextTick(() => {
    getUdfList();
    setOption(chartOptions.value);
  });
});

watch(
  () => canReadWriteData.value,
  (val) => {
    setOption(chartOptions.value);
    if (val) {
      if (window.sessionStorage.getItem('dataSpectrumStorage')) {
        const storageData = JSON.parse(window.sessionStorage.getItem('dataSpectrumStorage') as string);
        searchFormData.measurement = storageData.measurement;
        if (searchFormData.measurement) {
          searchFormData.measurementType = storageData.measurementType;
          searchFormData.method = storageData.method;
          searchFormData.resultType = storageData.resultType;
          searchFormData.compression = storageData.compression;
          searchFormData.frequency = storageData.frequency;
          searchFormData.amplification = storageData.amplification;
          searchFormData.datetimerange = storageData.datetimerange;
          searchFormData.dwtMethod = storageData.dwtMethod;
          searchFormData.coef = storageData.coef;
          searchFormData.layer = storageData.layer;
          searchFormData.wpass = storageData.wpass;
          searchFormData.partDatetimerange = storageData.partDatetimerange;
          searchFormData.partModel = storageData.partModel;
          searchFormData.partSeries = storageData.partSeries;
          searchFormData.distance = storageData.distance;
          markPointCount.value = storageData.markPointCount;
          dwtTab.value = storageData.dwtTab;
          if (searchFormData.method === 'DWT' && searchFormData.measurement) {
            getCount();
          }
          const cursorData = storageData.pointLineData
            .filter((f: MarkPointLine) => f.type === 'cursor')
            .map((item: MarkPointLine, index: number) => {
              return {
                ...item,
                label: {
                  formatter: () => (markPointCount.value === 1 ? 'D' : `D${index + 1}`),
                  position: 'end',
                  color: '#fff',
                },
              };
            });
          const otherData = storageData.pointLineData.filter((f: MarkPointLine) => f.type !== 'cursor');
          pointLineData.value = [...cursorData, ...otherData];
          pointList.value = storageData.pointList;
          harmonicFrequency.value = storageData.harmonicFrequency;
          frequencyInterval.value = storageData.frequencyInterval;
          sqlValue.value = storageData.sqlValue;
          sideband.value = storageData.sideband;
          clickedStatus.cursor = false;
          clickedStatus.frequency = storageData.clickedStatus.frequency;
          drawedStatus.frequency = storageData.drawedStatus.frequency;
          clickedOperate.value = '';
          if (storageData.sidebandData.length < 2) {
            clickedStatus.sideband = false;
            drawedStatus.sideband = false;
            sidebandData.value = [];
          } else {
            clickedStatus.sideband = storageData.clickedStatus.sideband;
            drawedStatus.sideband = storageData.drawedStatus.sideband;
            sidebandData.value = storageData.sidebandData;
          }
          currentPoint = storageData.currentPoint;
          handleSearch(true);
        }
      }
    }
  },
  {
    immediate: true,
  },
);
</script>

<style lang="scss" scoped>
.data-spectrum-wrapper {
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  padding: 26px 16px 16px 30px;
}

.search-form-box {
  display: flex;

  :deep(.el-form) {
    flex: 1;
  }

  :deep(.el-form-item--default) {
    margin: 0 24px 0 0;
  }

  .search-form-row-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-form-buttons {
    margin-left: 12px;
    display: inline-flex;
    flex-wrap: nowrap;
    align-self: end;
  }
}

.search-method-params-box {
  padding: 4px;
  border-radius: 2px;
  background: #f7f8fc;
  display: flex;
  align-items: center;

  .params-title {
    margin: 0 24px 0 12px;
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #495ad4;
  }
}

.search-data-list {
  display: inline-flex;
  margin: 0 8px 0 0;
  border-radius: 12px;
  background-color: #fff;
  padding: 4px;

  .search-data-type {
    padding: 3px 12px 3px 8px;
    cursor: pointer;
    border-radius: 12px;
    background-color: transparent;
    font-size: 12px;
    line-height: 12px;
    font-weight: 300;
    color: #656a85;
    white-space: nowrap;
  }

  .search-data-active {
    background-color: #495ad4;
    color: #fff;
    padding: 3px 12px;
  }
}

.chart-detail-wrapper {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  min-height: 300px;
  overflow: hidden;
}

.cursor-button {
  border: none;
}

.disable-cursor {
  color: #495ad4 !important;
  background-color: #f0f1fa !important;
}

.chart-operate-box {
  font-size: 12px;
  font-weight: 400;
  line-height: 12px;
  color: #131926;
  display: flex;
  align-items: center;
  margin: 0 0 0 12px;
  border: 1px solid #dfe1ed;
  height: 24px;
  box-sizing: border-box;

  .el-button {
    padding: 0 6px !important;
    min-width: 40px;
    height: 22px !important;
    border-radius: 0;
    border: none;
  }

  .el-input-number {
    width: 38px;
    height: 22px;

    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      border-radius: 0;
      padding-left: 2px;
      padding-right: 2px;

      &:focus-visible,
      &:hover {
        box-shadow: none !important;
      }
    }

    :deep(.el-input__wrapper.is-focus) {
      box-shadow: none !important;
    }
  }

  :deep(.el-input.is-disabled .el-input__wrapper) {
    background-color: #fff;
  }

  .disable-frequency {
    background: #f0f1fa !important;
    color: #00b3aa !important;
  }

  .enable-frequency {
    background-color: #00b3aa !important;
    color: #fff !important;
  }

  .disable-sideband {
    background: #f0f1fa !important;
    color: #6738bd !important;
  }

  .enable-sideband {
    background-color: #6738bd !important;
    color: #fff !important;
  }
}

.path-list-wrapper {
  margin-left: 16px;
  background-color: #f7f8fc;
  border-radius: 2px;
  box-sizing: border-box;
  padding: 12px 16px;
  position: relative;
  transition: all 0.3s ease;
}

.tabs-nav-aside {
  flex: 1;
  width: 100%;
  overflow-y: hidden;
  height: calc(100% - 28px);

  :deep(.el-tabs__header) {
    margin: 0;
    font-size: 14px;
    line-height: 21px;
    font-weight: 400;
  }

  :deep(.el-tabs__item) {
    padding: 0 !important;
    height: 24px !important;
  }

  :deep(.el-tabs__active-bar) {
    border-radius: 2px 2px 0 0;
  }

  :deep(.el-tabs__content) {
    width: 100%;
    padding-top: 4px;
    overflow: hidden;
    height: calc(100% - 28px);
  }

  .el-tab-pane {
    height: 100%;
    overflow: hidden;
  }
}

.expand-icon {
  position: absolute;
  bottom: 0;
  left: 16px;
  cursor: pointer;
  color: #a0a3b8;

  &:hover {
    color: #495ad4;
  }

  &.collapse-icon {
    left: 0;
    transform: rotate(-180deg);
  }
}

.collapse-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 17px;
  color: #495ad4;
  margin: 14px 5px 0;
}

.switch-list {
  display: flex;
  margin-right: 12px;
  border-radius: 12px;
  background-color: #f0f1fa;
  padding: 4px;

  .switch-type {
    padding: 3px 9px;
    cursor: pointer;
    border-radius: 12px;
    background-color: transparent;
    font-size: 12px;
    line-height: 12px;
    color: #656a85;
  }

  .switch-active {
    background-color: #495ad4;
    color: #fff;
  }
}

.detail-part-icon {
  border-radius: 4px;
  min-width: auto !important;
  width: 30px !important;
  height: 30px !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}
</style>
<style lang="scss">
.side-list-box {
  border-radius: 2px;
  background: #fff;
  overflow-y: auto;
  height: calc(100% - 16px);
  padding: 8px;
}
</style>
