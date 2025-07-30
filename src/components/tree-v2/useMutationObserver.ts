import { onMounted, onUnmounted, ref } from 'vue';
import * as _ from 'lodash-es';

const { isString, throttle } = _;

interface IMutationObserverOptions {
  childList: boolean; // 观察目标子节点的变化，是否有添加或者删除
  attributes: boolean; // 观察属性变动
  subtree: boolean; // 观察后代节点，默认为 false
}

/**
 * 创建并返回一个新的观察器，它会在触发指定 DOM 事件时，调用指定的回调函数
 * @param el
 * @param callback
 * @param observerOptions
 */
const useMutationObserver = (
  el: HTMLElement | string,
  callback: (mutationList: MutationRecord[], observer: MutationObserver) => void = () => {},
  observerOptions: IMutationObserverOptions = {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    attributes: false, // 观察属性变动
    subtree: true, // 观察后代节点，默认为 false
  },
) => {
  const observer = ref<MutationObserver>();
  const observerCallback = throttle(callback, 200);
  /**
   *
   * @param html {HTMLElement}  需要观察的元素
   */
  const creatObserver = function (html: HTMLElement) {
    if (!html) return;
    // 选择需要观察变动的节点
    const targetNode = html;

    // 观察器的配置（需要观察什么变动）
    const config = observerOptions;

    // 创建一个观察器实例并传入回调函数
    const observerCB = new MutationObserver(observerCallback);

    // 以上述配置开始观察目标节点
    observerCB.observe(targetNode, config);

    return observerCB;
  };
  onMounted(() => {
    const targetObserverEl = isString(el) ? (document.querySelector(el) as HTMLElement) : el;
    if (targetObserverEl) {
      observer.value = creatObserver(targetObserverEl);
    }
  });

  onUnmounted(() => {
    observer.value?.disconnect?.();
  });
  return {
    observer,
  };
};
export default useMutationObserver;
