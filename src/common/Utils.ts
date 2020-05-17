/**
 * Convert any valid color string into a hex code and RGB
 * value using the built in browser converter.
 * taken from
 * https://stackoverflow.com/questions/1573053/
 * and
 * https://stackoverflow.com/questions/5623838/
 * @param str The string to convert
 * @returns An object that contains the hex and rgb values for that string
 *          Default to black (#000000) if the string is not recognized.
 */
export function stringToColor(
  str: string
): {
  hex: string;
  rgb: { red: number; green: number; blue: number };
} {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx!.fillStyle = str;
  let hex = ctx!.fillStyle!;

  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
  // (I think only necessary in testing, but might catch odd browser behavior)
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return "#" + r + r + g + g + b + b;
  });

  var rgbaResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
  return {
    hex: hex,
    rgb: {
      red: parseInt(rgbaResult[1], 16),
      green: parseInt(rgbaResult[2], 16),
      blue: parseInt(rgbaResult[3], 16),
    },
  };
}

/**
 * Generate a UUID. Modified from:
 * https://stackoverflow.com/questions/105034
 */
export function generateUUIDv4() {
  const x = (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11) as string;
  return x.replace(/[018]/g, function (c: string) {
    return (
      parseInt(c) ^
      (window.crypto.getRandomValues(new Uint8Array(1))[0] &
        (15 >> (parseInt(c) / 4)))
    ).toString(16);
  });
}

/**
 * Creates an object composed of keys generated from the results of
 * running each element of collection through fn. The corresponding
 * value of each key is an array of the elements responsible for
 * generating the key. (description taken from lodash documentation)
 *
 * The difference between this function and the lodash "groupBy",
 * function is that this returns a Map object, allowing for more complex
 * keys.
 *
 * @param items
 * @param fn
 */
export function mapGroupBy<T1, T2>(
  items: T1[],
  fn: (item: T1) => T2
): Map<T2, T1[]> {
  //{ [key: string]: T[] } {
  return items.reduce((acc, item) => {
    const key = fn(item);
    const existing = acc.get(key) ? acc.get(key)! : [];
    acc.set(key, [...existing, item]);
    return acc;
  }, new Map<T2, T1[]>());
}

/**
 * Array type that requires at least one array element.
 * https://stackoverflow.com/questions/49910889
 */
export type ArrayOneOrMore<T> = {
  0: T;
} & Array<T>;

/**
 * Get all the parameters in the URL. Taken from:
 * https://stackoverflow.com/questions/979975
 */
export function getURLParameters() {
  return window.location.search
    .substring(1)
    .split("&")
    .map((v) => v.split("="))
    .reduce(
      (map, [key, value]) => map.set(key, decodeURIComponent(value)),
      new Map<string, string>()
    );
}

/**
 * Get an Error that represents a parser problem
 */
export function getParseError(parserName: string, errorMessage: string) {
  const toReturn = new Error(errorMessage);
  toReturn.name = parserName;
  return toReturn;
}
