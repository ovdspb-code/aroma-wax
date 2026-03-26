import { ShopifyProduct } from "@/types/clp";

export const mockProducts: ShopifyProduct[] = [
  {
    id: "mock-product-candle",
    title: "Black Pomegranate & Smoked Cedar Luxury Candle Fragrance",
    vendor: "AROMA + WAX",
    description: "Mock candle product for CLP label testing.",
    tags: ["luxury", "candle", "autumn", "long-name-test"],
    metafields: {
      templateType: "candle",
      signalWord: "Warning",
      contains: [
        "Linalool",
        "Tetramethyl acetyloctahydronaphthalenes",
        "Reaction mass of cis-4-(isopropyl)cyclohexanemethanol and trans-4-(isopropyl)cyclohexanemethanol",
      ],
      hStatements: [
        "H317 May cause an allergic skin reaction.",
        "H412 Harmful to aquatic life with long lasting effects.",
      ],
      pStatements: [
        "P101 If medical advice is needed, have product container or label at hand.",
        "P102 Keep out of reach of children.",
        "P302+P352 IF ON SKIN: Wash with plenty of water.",
      ],
      euhStatements: ["EUH208 Contains linalool. May produce an allergic reaction."],
      pictograms: ["GHS07", "GHS09"],
      netQuantityDefault: "220 g",
      extraWarning:
        "Always remove packaging before burning. Never leave a burning candle unattended.",
    },
    variants: [
      {
        id: "mock-variant-candle-220",
        title: "220 g",
        sku: "MOCK-CAN-220",
        metafields: {
          netQuantityDefault: "220 g",
        },
      },
      {
        id: "mock-variant-candle-500",
        title: "500 g",
        sku: "MOCK-CAN-500",
        metafields: {
          netQuantityDefault: "500 g",
          pStatements: [
            "P101 If medical advice is needed, have product container or label at hand.",
            "P102 Keep out of reach of children.",
            "P273 Avoid release to the environment.",
          ],
        },
      },
    ],
  },
  {
    id: "mock-product-diffuser",
    title: "Neroli Blossom Reed Diffuser Base Blend",
    vendor: "AROMA + WAX",
    description: "Mock diffuser product for CLP label testing.",
    tags: ["diffuser", "fresh", "citrus"],
    metafields: {
      templateType: "diffuser",
      signalWord: "Danger",
      contains: [
        "Citral",
        "Limonene",
        "Linalyl acetate",
        "2,4-Dimethyl-3-cyclohexene carboxaldehyde",
      ],
      hStatements: [
        "H225 Highly flammable liquid and vapour.",
        "H319 Causes serious eye irritation.",
        "H411 Toxic to aquatic life with long lasting effects.",
      ],
      pStatements: [
        "P210 Keep away from heat, hot surfaces, sparks, open flames and other ignition sources.",
        "P233 Keep container tightly closed.",
        "P305+P351+P338 IF IN EYES: Rinse cautiously with water for several minutes.",
      ],
      euhStatements: [],
      pictograms: ["GHS02", "GHS07", "GHS09"],
      netQuantityDefault: "100 ml",
      extraWarning: "Do not place directly on polished, painted or synthetic surfaces.",
    },
    variants: [
      {
        id: "mock-variant-diffuser-100",
        title: "100 ml",
        sku: "MOCK-DIF-100",
        metafields: {
          netQuantityDefault: "100 ml",
        },
      },
    ],
  },
  {
    id: "mock-product-roomspray",
    title: "White Tea & Linen Room Spray",
    vendor: "AROMA + WAX",
    description: "Mock room spray product for CLP label testing.",
    tags: ["room spray", "clean", "linen"],
    metafields: {
      templateType: "room_spray",
      signalWord: "Warning",
      contains: ["Limonene", "Hexyl cinnamal"],
      hStatements: [
        "H226 Flammable liquid and vapour.",
        "H317 May cause an allergic skin reaction.",
      ],
      pStatements: [
        "P102 Keep out of reach of children.",
        "P210 Keep away from heat, hot surfaces, sparks, open flames and other ignition sources.",
      ],
      euhStatements: ["EUH208 Contains limonene. May produce an allergic reaction."],
      pictograms: ["GHS02", "GHS07"],
      netQuantityDefault: "100 ml",
      extraWarning: "Avoid spraying directly onto fabrics, pets or skin.",
    },
    variants: [
      {
        id: "mock-variant-roomspray-100",
        title: "100 ml",
        sku: "MOCK-RS-100",
        metafields: {
          netQuantityDefault: "100 ml",
        },
      },
    ],
  },
];
