export default class Calculator {
  static add(...args: Array<string | number>): number {
    const [a, b, ...ns] = args;
    const m = this.fixParam(a, 0);
    const n = this.fixParam(b, 0);
    const len1 = this.getDecimalLen(m);
    const len2 = this.getDecimalLen(n);
    const len = Math.max(len1, len2);
    const intM = this.movePoint(m, 'right', len);
    const intN = this.movePoint(n, 'right', len);
    const intSum = intM + intN;
    const sum = this.movePoint(intSum, 'left', len);
    if (ns.length) {
      return this.add(sum, ...ns);
    }
    return sum;
  }

  static subtract(...args: Array<string | number>): number {
    const arr = args.slice(1).map((n) => -Number(n));
    return this.add(args[0], ...arr);
  }

  static multiply(...args: Array<string | number>): number {
    const [a, b, ...ns] = args;
    const m = this.fixParam(a, 1);
    const n = this.fixParam(b, 1);
    const len1 = this.getDecimalLen(m);
    const len2 = this.getDecimalLen(n);
    const len = len1 + len2;
    const intM = this.movePoint(m, 'right', len1);
    const intN = this.movePoint(n, 'right', len2);
    const intProduct = intM * intN;
    const product = this.movePoint(intProduct, 'left', len);
    if (ns.length) {
      return this.multiply(product, ...ns);
    }
    return product;
  }

  static divide(...args: Array<string | number>): number {
    const [a, b, ...ns] = args;
    const m = this.fixParam(a, 1);
    const n = this.fixParam(b, 1);
    const len1 = this.getDecimalLen(m);
    const len2 = this.getDecimalLen(n);
    const len = Math.max(len1, len2);
    const intM = this.movePoint(m, 'right', len);
    const intN = this.movePoint(n, 'right', len);
    const intQuotient = intM / intN;
    const quotient = intQuotient;
    if (ns.length) {
      return this.divide(quotient, ...ns);
    }
    return quotient;
  }

  /**
   * 获取小数部分
   */
  static getDecimal(num: number): string {
    return String(num).split('.')[1] || '0';
  }

  /**
   * 获取小数部分长度
   */
  static getDecimalLen(num: number): number {
    const decimal = this.getDecimal(num);
    if (decimal && decimal !== '0') {
      return decimal.length;
    }
    return 0;
  }

  static movePoint(
    num: string | number,
    direction: 'left' | 'right',
    digits: number,
  ) {
    let str = String(num);
    let prefix = str[0];
    if (prefix === '-') {
      str = str.replace('-', '');
    } else {
      prefix = '';
    }
    const n = direction === 'left'
      ? this.movePoint2Left(str, digits)
      : this.movePoint2Right(str, digits);
    return Number(`${prefix}${n}`);
  }

  static movePoint2Left(
    num: string | number,
    digits: number,
  ) {
    const arr = String(num).split('');
    let index = arr.indexOf('.');
    if (index === -1) {
      arr.push('.');
      arr.push('0');
      index = arr.indexOf('.');
    }
    for (let i = 0; i < digits; i += 1) {
      if (i >= index) {
        arr[0] = '0';
        arr.unshift('.');
      } else {
        const j = index - i;
        const m = arr[j];
        const n = arr[j - 1];
        arr[j] = n;
        arr[j - 1] = m;
      }
    }
    return Number(arr.join(''));
  }

  static movePoint2Right(
    num: string | number,
    digits: number,
  ) {
    const arr = String(num).split('');
    const index = arr.indexOf('.');
    if (index === -1) {
      for (let i = 0; i < digits; i += 1) {
        arr.push('0');
      }
    } else {
      for (let i = 0; i <= digits; i += 1) {
        const j = index + i;
        const m = arr[j];
        if (j === arr.length - 1 && m === '.') {
          arr.pop();
        } else if (m !== '.') {
          arr.push('0');
        } else {
          const n = arr[j + 1];
          arr[j] = n;
          arr[j + 1] = m;
        }
      }
    }
    return Number(arr.join(''));
  }

  static fixParam(a: number | string, val: number) {
    if (['', undefined, null].includes(a as string | null | undefined)) {
      return val;
    }
    if (typeof a === 'boolean') {
      return val;
    }
    if (Number.isNaN(Number(a))) {
      return val;
    }
    return Number(a);
  }

  static toFixed(n: number | string, end: number): number {
    const arrN = `${n}`.split('.');
    if (arrN.length === 1) {
      return Number(n);
    }
    arrN[1] = arrN[1].substring(0, end);
    return Number(arrN.join('.'));
  }
}
