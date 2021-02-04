export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const empty = () => {};
export const isPlainObject = (obj) => obj instanceof Object && !(obj instanceof Array);
export const isEmptyObject = (obj) => isPlainObject(obj) && Object.keys(obj).length === 0;
export const isTrueStr = (str) => {
  if (typeof str === 'string') return str === 'true';
  else return str;
};
export const capitalizeFirstLetter = (str) =>
  typeof str === 'string' && str ? str[0].toUpperCase() + str.slice(1) : str;

export const stringHashCode = (str) => {
  var hash = 0;
  if (str.length == 0) return hash;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};
export const intToHSL = (v, s = '100%', l = '40%') => `hsl(${v % 360},${s},${l})`;
export const stringToColor = (str, s, l) => intToHSL(stringHashCode(str), s, l);
