import Calculator from './calc';

export function hasOwn(o: object, key: string) {
  return Object.prototype.hasOwnProperty.call(o, key);
}

export function cent2Yuan(price: number) {
  return Calculator.divide(price, 100);
}
