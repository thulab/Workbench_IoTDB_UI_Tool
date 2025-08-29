export default class Validator {
  static isEmpty(val: any) {
    return ['', null, undefined]!.indexOf(val) > -1 || (val.trim ? val.trim() === '' : false) || val.length === 0;
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

  /**
   * Validate TTL value (string or number) against Java Long max.
   * Returns true if valid; otherwise returns an Error instance (so caller can decide to throw or callback).
   * Rules:
   *  - empty string => valid (interpreted as INF by caller)
   *  - must be a non-negative integer
   *  - must be < 2^63-1 (Java Long MAX)
   */
  static validateTTL(val: any, t?: (k: string) => string): true | Error {
    if (val === '' || val === null || val === undefined) return true; // empty means INF
    // Only allow integer (no decimals, no negative sign)
    if (!/^\d+$/.test(String(val))) {
      return new Error(t ? t('dataManage.ttlInvalidNumber') : 'Invalid TTL');
    }
    try {
      const bigIntValue = BigInt(val);
      const JAVA_LONG_MAX = BigInt('9223372036854775807');
      if (bigIntValue >= JAVA_LONG_MAX) {
        return new Error(t ? t('dataManage.ttlTooLarge') : 'TTL too large');
      }
      return true;
    } catch {
      return new Error(t ? t('dataManage.ttlInvalidNumber') : 'Invalid TTL');
    }
  }
}
