/** [0, 1, ..., count - 1] — used to render fixed-size rows of fields. */
export const range = (count) => Array.from({ length: count }, (_, index) => index);
