/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
    if (size === 0 || !string) return ''
    if (!size) return string

    let result = ''
    let prevSymbol
    let counter = 0

    for (let i = 0; i < string.length; i++) {
        const currentSymbol = string[i]

        if (currentSymbol === prevSymbol) {
            counter++
        } else {
            counter = 1
            prevSymbol = currentSymbol
        }

        if (counter <= size) {
            result += currentSymbol
        }
    }

    return result
}
