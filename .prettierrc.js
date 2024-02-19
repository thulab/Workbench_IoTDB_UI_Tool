module.exports = {
  printWidth: 200, // 每行最多显示的字符数
  tabWidth: 2, // tab的宽度 4个字符
  useTabs: false, // 禁止使用tab代替空格
  semi: true, // 结尾使用分号
  singleQuote: true, // 使用单引号代替双引号
  trailingComma: 'es5', // 结尾是否添加逗号
  bracketSpacing: true, // 对象括号俩边是否用空格隔开
  bracketSameLine: false, // 组件最后的尖括号不另起一行
  arrowParens: 'always', // 箭头函数参数始终添加括号
  htmlWhitespaceSensitivity: 'ignore', // html存在空格是不敏感的
  vueIndentScriptAndStyle: false, // vue 的script和style的内容是否缩进
  endOfLine: 'auto', // 行结尾形式 mac和linux是\n  windows是\r\n
  singleAttributePerLine: false, // 组件或者标签的属性是否控制一行只显示一个属性
  overrides: [
      {
          files: '*.vue', // 适用于 .vue 文件
          options: {
              printWidth: 200, // 自定义 .vue 文件的 printWidth
              tabWidth: 2, // 自定义 .vue 文件的 tabWidth
          },
      },
      {
          files: ['*.ts', '*.js', '*.json'],
          options: {
              tabWidth: 2, // 自定义 .json 文件的 tabWidth
          },
      },
  // 可以添加更多 overrides 配置
  ],
}
