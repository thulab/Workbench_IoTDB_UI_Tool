import type { App, Component } from 'vue';
// import BabelChart from './base/babel-chart.vue';
// import TotalInfo from './base/total-info.vue';
// import BabelCopy from './base/babel-copy.vue';

const components = import.meta.glob<Record<string, Component>>('./base/*.vue', { eager: true });

const baseComponents = {
  install: (app: App) => {
    Object.keys(components).forEach((key) => {
      // 从文件名中取组件名，如果是index.vue则取文件夹名
      const nameByKey = key.includes('index.vue') ? key.replace(/\.\/base\/(.*)\/index\.vue/, '$1') : key.replace(/\.\/base\/(.*)\.vue/, '$1');
      const component = components[key]!.default;
      // 取组件内置的__name，如果是index则取nameByKey
      let nameByAuto = (component as { __name: string }).__name;
      if (nameByAuto === 'index') {
        nameByAuto = nameByKey;
      }
      // 有哪个用哪个 优先级：name > __name > key
      const name = component!.name || nameByAuto || nameByKey;
      app.component(name, component!);
    });
    // app
    //   .component(BabelChart.__name || 'BabelChart', BabelChart)
    //   .component(TotalInfo.__name || 'TotalInfo', TotalInfo)
    //   .component(BabelCopy.__name || 'BabelCopy', BabelCopy);
  },
};

export default baseComponents;
