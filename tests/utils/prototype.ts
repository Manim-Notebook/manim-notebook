declare global {
  interface Array<T> {
    removeByValue(_value: T): Array<T>;
  }
}

/**
 * Removes the first occurrence of the specified value from the array.
 *
 * From https://stackoverflow.com/a/5767332/9655481
 *
 * @param value The value to remove.
 */
Array.prototype.removeByValue = function (value: any) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] === value) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
