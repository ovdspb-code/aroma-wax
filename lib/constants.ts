export const templateOptions = [
  { value: "candle", label: "Candle" },
  { value: "diffuser", label: "Diffuser" },
  { value: "room_spray", label: "Room Spray" },
] as const;

export const sizePresetOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
] as const;

export const templateSizePresets = {
  candle: {
    small: { key: "small", label: "Small", widthMm: 60, heightMm: 40 },
    medium: { key: "medium", label: "Medium", widthMm: 70, heightMm: 50 },
    large: { key: "large", label: "Large", widthMm: 80, heightMm: 60 },
  },
  diffuser: {
    small: { key: "small", label: "Small", widthMm: 80, heightMm: 50 },
    medium: { key: "medium", label: "Medium", widthMm: 90, heightMm: 60 },
    large: { key: "large", label: "Large", widthMm: 100, heightMm: 70 },
  },
  room_spray: {
    small: { key: "small", label: "Small", widthMm: 85, heightMm: 45 },
    medium: { key: "medium", label: "Medium", widthMm: 95, heightMm: 55 },
    large: { key: "large", label: "Large", widthMm: 105, heightMm: 65 },
  },
} as const;

export const pictogramOptions = [
  "GHS02",
  "GHS05",
  "GHS07",
  "GHS08",
  "GHS09",
] as const;
