/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(field) {
  const path = field.split('.')

  return function (obj) {
    let current = obj

    for (const key of path) {
      if (!current?.hasOwnProperty(key)){
        return
      }
      current = current[key]
    }

    return current
  }
}