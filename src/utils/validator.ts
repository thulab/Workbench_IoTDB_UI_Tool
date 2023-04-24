export default class Validator {
  static isEmpty(val: any) {
    return ['', null, undefined].indexOf(val) > -1 || (val.trim ? val.trim() === '' : false) || val.length === 0;
  }

  static isNumber(val: any) {
    return /^(-|\+)?\d+(\.\d+)?$/.test(val);
  }

  static isInteger(val: any) {
    return /^(-|\+)?\d+$/.test(val);
  }

  static isZero(val: any) {
    return this.isNumber(val) && Number(val) === 0;
  }

  static min(val: any, minVal: number, equal = true) {
    return this.isNumber(val) && (equal ? val >= minVal : val > minVal);
  }

  static max(val: any, maxVal: number, equal = true) {
    return this.isNumber(val) && (equal ? val <= maxVal : val < maxVal);
  }

  static maxFloat(val: any, floatLength = 2) {
    // /^(-|\+)?\d+(\.\d{0,2})?$/
    return new RegExp(`^(-|\\+)?\\d+(\\.\\d{0,${floatLength}})?$`).test(val);
  }
}
