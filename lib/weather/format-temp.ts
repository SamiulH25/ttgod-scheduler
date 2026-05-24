/** Display temperatures in Fahrenheit (v1 default for squad app). */
export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

export function formatTempF(celsius: number): string {
  return `${celsiusToFahrenheit(celsius)}°`;
}

export function formatTempRangeF(highC: number, lowC: number): string {
  return `${formatTempF(highC)}/${formatTempF(lowC)}`;
}
