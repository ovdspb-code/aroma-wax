export const templateOptions = [
  { value: "candle", label: "Candle" },
  { value: "diffuser", label: "Diffuser" },
  { value: "room_spray", label: "Room Spray" },
] as const;

export const templatePresets = {
  candle: { key: "jar_front_70x50", label: "Jar Front 70 x 50 mm", widthMm: 70, heightMm: 50 },
  diffuser: {
    key: "diffuser_body_90x60",
    label: "Diffuser Body 90 x 60 mm",
    widthMm: 90,
    heightMm: 60,
  },
  room_spray: {
    key: "spray_body_95x55",
    label: "Spray Body 95 x 55 mm",
    widthMm: 95,
    heightMm: 55,
  },
};

export const pictogramOptions = [
  "GHS02",
  "GHS05",
  "GHS07",
  "GHS08",
  "GHS09",
] as const;
