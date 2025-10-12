/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
    const k = param === 'asc' ? 1 : -1;

    return [...arr].sort((a, b) =>
        k * a.localeCompare(b, ['ru', 'en'], {
            caseFirst: "upper"
        })
    );
}

/*
Extra solution

function sortStrings(arr, param = 'asc') {
    return arr.toSorted((a, b) => {
        return param === 'desc' ?
            b.localeCompare(a, ['ru', 'en'], { caseFirst: 'upper' }) :
            a.localeCompare(b, ['ru', 'en'], { caseFirst: 'upper' })
    })
}
*/

