/** @type {import('stylelint').Config} */
module.exports = {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-recommended-vue/scss', 'stylelint-prettier/recommended'],
  rules: {
    'selector-pseudo-element-no-unknown': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep'],
      },
    ],
    'font-family-no-missing-generic-family-keyword': null,
    'selector-class-pattern': [
      '^([a-z][a-z0-9]*)(((-|--|__|_)[a-z0-9]+)*)$',
      {
        message: 'Expected class selector to be kebab-case',
      },
    ],
  },
  ignoreFiles: ['src/styles/main.scss'],
  overrides: [{ files: ['*.vue'], rules: { 'custom-property-empty-line-before': null } }],
};
