// FIPS state code (as used in the us-atlas topojson) -> USPS abbreviation
// (as used in our geo_index data, which comes from SSA's state files).
export const FIPS_TO_USPS: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
  "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
  "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
  "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
  "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY",
};

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

/** index (over/under-index vs national baseline) -> diverging cold (under-indexed) / hot (over-indexed) scale. */
export const GEO_SCALE = {
  min: 0.4,
  center: 1,
  max: 2.2,
  cold: [30, 90, 140] as [number, number, number],
  neutral: [240, 242, 246] as [number, number, number],
  hot: [186, 62, 28] as [number, number, number],
  noData: "#c7cbd2",
};

export function indexToColor(index: number | undefined): string {
  if (index === undefined || Number.isNaN(index)) return GEO_SCALE.noData;
  const { min, center, max, cold, neutral, hot } = GEO_SCALE;

  const [lo, hi, t] =
    index <= center
      ? [cold, neutral, Math.max(0, Math.min(1, (index - min) / (center - min)))]
      : [neutral, hot, Math.max(0, Math.min(1, (index - center) / (max - center)))];

  const rgb = lo.map((c, i) => Math.round(c + (hi[i] - c) * t));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
