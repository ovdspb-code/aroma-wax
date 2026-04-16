# PT-PT PDP Queue Registry

Date: 2026-04-15

Source of truth: live Shopify Admin catalog read on 2026-04-15.

Packet 04 draft reference: `data/translation/pt-PT/packet-04-products-pt-PT.md`

## Scope summary

- Total PDPs in catalog: 142
- Active storefront PDPs: 97
- Unlisted sample PDPs: 45
- Translation rule for every row: `FULL_REWRITE_1_TO_1`
- Working unit: one PDP = one complete cycle (source capture -> translation -> completeness check -> import to test -> visual QA).

## Working rules

- Do not treat current PT text as the source of truth.
- Work from the live English PDP, block by block, preserving order and meaning 1:1.
- Do not compress, summarize, soften, or “improve” commercial copy.
- Preserve all lists, quantities, options, checkout note instructions, percentages, weights, and itemized kit contents.
- Do not touch handles while working on descriptions, even where catalog anomalies exist.
- Import to test only; no live publication from this queue.

## Wave plan

### Wave 01

- Total: 8
- Active: 8
- Unlisted sample: 0
- Lanes: starter_kits, sample_kits

### Wave 02

- Total: 11
- Active: 11
- Unlisted sample: 0
- Lanes: waxes, wicks

### Wave 03

- Total: 7
- Active: 7
- Unlisted sample: 0
- Lanes: bases_additives, reeds

### Wave 04

- Total: 25
- Active: 25
- Unlisted sample: 0
- Lanes: containers_packaging, dyes

### Wave 05

- Total: 46
- Active: 46
- Unlisted sample: 0
- Lanes: fragrance_oils

### Wave 06

- Total: 45
- Active: 0
- Unlisted sample: 45
- Lanes: sample_fragrance_oils

## Queue by wave

### Wave 01 items

- `candle-business-starter-kit` | Candle Business Starter Kit | ACTIVE | starter_kits
- `home-fragrances-business-starter-kit` | Home Fragrances Business Starter Kit | ACTIVE | starter_kits
- `all-seasons-classics-fragrance-oils-kit` | All-Seasons Classics Fragrance Oils Kit | ACTIVE | sample_kits
- `autumn-and-holidays-fragrance-oils-2025-kit` | Autumn and Holidays Fragrance Oils Kit | ACTIVE | sample_kits
- `my-first-collection-fragrance-oils-kit` | My First Collection Fragrance Oils Kit | ACTIVE | sample_kits
- `simply-delicious-fragrances-kit` | Simply Delicious Fragrances Kit | ACTIVE | sample_kits
- `summer-2026-fragrance-oils-kit` | Summer Fragrance Oils Kit | ACTIVE | sample_kits
- `winter-fragrances-kit` | Winter Fragrance Oils Kit | ACTIVE | sample_kits

### Wave 02 items

- `ecoolive™-pillar-wax` | EcoOlive™ Pillar Wax | ACTIVE | waxes — Non-standard handle characters present; do not touch handle while working on descriptions.
- `ecosoya™-cb-advanced-container-wax` | EcoSoya™ CB-Advanced Container Wax | ACTIVE | waxes — Non-standard handle characters present; do not touch handle while working on descriptions.
- `ecosoya™-pillarblend-wax` | EcoSoya™ PillarBlend Wax | ACTIVE | waxes — Non-standard handle characters present; do not touch handle while working on descriptions.
- `golden-waxtm-464-container-soy-wax` | Golden Wax™ 464 Сontainer Wax | ACTIVE | waxes
- `golden-wax™-r45-сontainer-wax` | Golden Wax™ R45+ Сontainer Wax | ACTIVE | waxes — Non-standard handle characters present; do not touch handle while working on descriptions.
- `golden-wax™-y50-wax-melts-wax` | Golden Wax™ Y50 Wax Melts Wax | ACTIVE | waxes — Non-standard handle characters present; do not touch handle while working on descriptions.
- `kerasoy™-pillar-wax-4120` | KeraSoy™ Pillar Wax 4120 | ACTIVE | waxes — Non-standard handle characters present; do not touch handle while working on descriptions.
- `naturewax™-c-3-container-soy-wax` | NatureWax™ C-3 Container Soy Wax | ACTIVE | waxes — Non-standard handle characters present; do not touch handle while working on descriptions.
- `braded-cotton-wicks` | Braded Cotton Wicks | ACTIVE | wicks — Handle/title typo: Braded Cotton Wicks.
- `wk-st-stabilo-series-cotton-wicks` | Stabilo Series Cotton Wicks | ACTIVE | wicks
- `tcr-series-cotton-wicks` | TCR Series Cotton Wicks | ACTIVE | wicks

### Wave 03 items

- `augeo-diffuser-base` | Augeo Diffuser Base | ACTIVE | bases_additives
- `solubilizer-polysorbate-20` | Solubilizer Polysorbate 20 | ACTIVE | bases_additives
- `tefacid®-stearic-acid` | Tefacid® Stearic Acid | ACTIVE | bases_additives — Non-standard handle characters present; do not touch handle while working on descriptions.
- `classic-reed-diffuser-bottles-100-ml` | Classic Reed Diffuser Bottle with Cork and Cap, 100 ml | ACTIVE | reeds
- `classic-reed-diffuser-bottles-50-ml` | Classic Reed Diffuser Bottle with Cork and Cap, 50 ml | ACTIVE | reeds
- `fiber-diffuser-reeds` | Fiber Diffuser Reeds | ACTIVE | reeds
- `rattan-diffuser-reeds` | Rattan Diffuser Reeds | ACTIVE | reeds

### Wave 04 items

- `diffuser-bottle-and-metal-screw-cap-125-ml` | Apothecary Diffuser Bottle and Metal Screw Cap, 125 ml | ACTIVE | containers_packaging
- `apothecary-diffuser-bottle-and-metal-screw-cap-60-ml` | Apothecary Diffuser Bottle and Metal Screw Cap, 60 ml | ACTIVE | containers_packaging
- `apothecary-room-spray-bottle-and-sprayer-125-ml` | Apothecary Room Spray Bottle and Sprayer, 125 ml | ACTIVE | containers_packaging
- `rooom-spray-bottle-and-sprayer-60ml` | Apothecary Room Spray Bottle and Sprayer, 60 ml | ACTIVE | containers_packaging — Handle typo: rooom-spray.
- `glass-jar-metal-screw-cap-200-ml` | Glass Jar and Metal Screw Cap, 200 ml | ACTIVE | containers_packaging
- `metal-can-lid-200-ml` | Metal Can and Lid, 200 ml | ACTIVE | containers_packaging
- `metal-can-lid-500-ml` | Metal Can and Lid, 500 ml | ACTIVE | containers_packaging
- `metal-lever-lid-can-250-ml` | Metal Lever-lid Can, 250 ml | ACTIVE | containers_packaging
- `metal-screw-cap-70mm` | Metal Screw Cap, 70mm | ACTIVE | containers_packaging
- `metal-screw-cap-tin-10-ml` | Metal Screw-cap Tin, 10 ml | ACTIVE | containers_packaging
- `metal-screw-cap-tin-100-ml` | Metal Screw-cap Tin, 100 ml | ACTIVE | containers_packaging
- `room-spray-classic-bottle-125-ml` | Room Spray Classic Bottle, 125 ml | ACTIVE | containers_packaging
- `room-spray-classic-bottle-250-ml` | Room Spray Classic Bottle, 250 ml | ACTIVE | containers_packaging
- `vibrant-black-liquid-dye` | Vibrant Black Liquid Dye | ACTIVE | dyes
- `vibrant-blue-liquid-dye` | Vibrant Blue Liquid Dye | ACTIVE | dyes
- `vibrant-brown-liquid-dye` | Vibrant Brown Liquid Dye | ACTIVE | dyes
- `vibrant-burgundy-liquid-dye` | Vibrant Burgundy Liquid Dye | ACTIVE | dyes
- `vibrant-green-liquid-dye` | Vibrant Green Liquid Dye | ACTIVE | dyes
- `vibrant-magenta-liquid-dye` | Vibrant Magenta Liquid Dye | ACTIVE | dyes
- `vibrant-navy-liquid-dye` | Vibrant Navy Liquid Dye | ACTIVE | dyes
- `vibrant-olive-green-liquid-dye` | Vibrant Olive Green Liquid Dye | ACTIVE | dyes
- `vibrant-orange-liquid-dye` | Vibrant Orange Liquid Dye | ACTIVE | dyes
- `vibrant-purple-liquid-dye` | Vibrant Purple Liquid Dye | ACTIVE | dyes
- `vibrant-red-liquid-dye` | Vibrant Red Liquid Dye | ACTIVE | dyes
- `vibrant-yellow-liquid-dye` | Vibrant Yellow Liquid Dye | ACTIVE | dyes

### Wave 05 items

- `agarwood-noble-incense-fragrance-oil` | Agarwood & Noble Incense Fragrance Oil | ACTIVE | fragrance_oils
- `black-cherry-and-corsican-almond-fragrance-oil-1` | Black Cherry and Corsican Almond Fragrance Oil | ACTIVE | fragrance_oils
- `black-pepper-and-velvet-orchid-fragrance-oil` | Black Pepper & Velvet Orchid Fragrance Oil | ACTIVE | fragrance_oils
- `black-pepper-sandalwood-tonka-fragrance-oil` | Black Pepper, Sandalwood and Tonka Fragrance Oil | ACTIVE | fragrance_oils
- `by-the-fireside-fragrance-oil` | By The Fireplace Fragrance Oil | ACTIVE | fragrance_oils
- `cashmere-wood-and-tonka-fragrance-oil` | Cashmere Wood & Tonka Fragrance Oil | ACTIVE | fragrance_oils
- `christmas-hearth-fragrance-oil` | Christmas Hearth Fragrance Oil | ACTIVE | fragrance_oils
- `dubai-pistachio-cream-fragrance-oil` | Dubai Pistachio Cream Fragrance Oil | ACTIVE | fragrance_oils
- `fresh-cotton-and-green-tea-fragrance-oil` | Fresh Cotton & Green Tea Fragrance Oil | ACTIVE | fragrance_oils
- `fresh-cut-grass-fragrance-oil` | Fresh Cut Grass Fragrance Oil | ACTIVE | fragrance_oils
- `fresh-cut-peony-fragrance-oil` | Fresh Cut Peony Fragrance Oil | ACTIVE | fragrance_oils
- `green-cardamom-eucalyptus-fragrance-oil` | Green Cardamom & Eucalyptus Fragrance Oil | ACTIVE | fragrance_oils
- `green-fig-and-wild-mushroom` | Green Fig and Wild Mushroom Fragrance Oil | ACTIVE | fragrance_oils
- `kyoto-matcha-and-coconut-cloud-fragrance-oil` | Kyoto Matcha & Coconut Cloud Fragrance Oil | ACTIVE | fragrance_oils
- `lavender-and-peppermint-fragrance-oil` | Lavender & Peppermint Fragrance Oil | ACTIVE | fragrance_oils
- `lemongrass-and-honey-fragrance-oil` | Lemongrass & Honey Fragrance Oil | ACTIVE | fragrance_oils
- `luscious-lime-and-basil-fragrance-oil` | Luscious Lime & Basil Fragrance Oil | ACTIVE | fragrance_oils
- `magnolia-and-peach-blossom-fragrance-oil` | Magnolia & Peach Blossom Fragrance Oil | ACTIVE | fragrance_oils
- `modern-gentleman-fougere-fragrance-oil` | Modern Gentleman Fougère Fragrance Oil | ACTIVE | fragrance_oils
- `moroccan-cedar-and-saffron-fragrance-oil` | Moroccan Cedar & Saffron Fragrance Oil | ACTIVE | fragrance_oils
- `muscat-and-fig-fragrance-oil` | Muscat & Fig Fragrance Oil | ACTIVE | fragrance_oils
- `nutmeg-ginger-spice-fragrance-oil` | Nutmeg, Ginger & Spice Fragrance Oil | ACTIVE | fragrance_oils
- `opium-and-musk-fragrance-oil` | Opium & Musk Fragrance Oil | ACTIVE | fragrance_oils
- `oud-wood-and-sweet-jasmin-fragrance-oil` | Oud Wood & Sweet Jasmin Fragrance Oil | ACTIVE | fragrance_oils
- `palo-santo-de-marabi-fragrance-oil` | Palo Santo de Marabi Fragrance Oil | ACTIVE | fragrance_oils
- `patchouli-vetiver-fragrance-oil` | Patchouli & Vetiver Fragrance Oil | ACTIVE | fragrance_oils
- `pineapple-creamy-coconut-fragrance-oil-2` | Pineapple & Creamy Coconut Fragrance Oil | ACTIVE | fragrance_oils
- `jasmine-fragrance-oil` | Pure Jasmine Fragrance Oil | ACTIVE | fragrance_oils
- `rose-champagne-fragrance-oil` | Rose & Champagne Fragrance Oil | ACTIVE | fragrance_oils
- `ruby-grapefruit-fragrance-oil` | Ruby Grapefruit Fragrance Oil | ACTIVE | fragrance_oils
- `sage-seasalt-fragrance-oil` | Sage & Seasalt Fragrance Oil | ACTIVE | fragrance_oils
- `siberian-cedar-and-bergamot-fragrance-oil` | Siberian Cedar & Bergamot Fragrance Oil | ACTIVE | fragrance_oils
- `sicilian-neroli-cashmere-fragrance-oil` | Sicilian Neroli & Cashmere Fragrance Oil | ACTIVE | fragrance_oils
- `smoky-myrrh-sage-fragrance-oil` | Smoky Myrrh & Sage Fragrance Oil | ACTIVE | fragrance_oils
- `spiced-apple-cinnamon-fragrance-oil` | Spiced Apple & Cinnamon Fragrance Oil | ACTIVE | fragrance_oils
- `suede-leather-orris-fragrance-oil` | Suede Leather & Orris Fragrance Oil | ACTIVE | fragrance_oils
- `sweet-amber-and-smoke-fragrance-oil` | Sweet Amber & Smoke Fragrance Oil | ACTIVE | fragrance_oils
- `tobacco-vanilla-fragrance-oil` | Tobacco & Vanilla Fragrance Oil | ACTIVE | fragrance_oils
- `tomato-leaf-fragrance-oil` | Tomato Leaf Fragrance Oil | ACTIVE | fragrance_oils
- `vanilla-and-patchouli-fragrance-oil` | Vanilla & Patchouli Fragrance Oil | ACTIVE | fragrance_oils
- `vanilla-cream-fragrance-oil` | Vanilla Cream Fragrance Oil | ACTIVE | fragrance_oils
- `very-gingerbread-fragrance-oil` | Very Gingerbread Fragrance Oil | ACTIVE | fragrance_oils
- `mango-fragrance-oil` | Very Mango Fragrance Oil | ACTIVE | fragrance_oils
- `wild-fern-moss-fragrance-oil` | Wild Fern & Moss Fragrance Oil | ACTIVE | fragrance_oils
- `wild-strawberry-cream-silk` | Wild Strawberry, Cream & Silk Fragrance Oil | ACTIVE | fragrance_oils
- `winter-pines-velvet-petals` | Winter Pines & Velvet Petals Fragrance Oil | ACTIVE | fragrance_oils

### Wave 06 items

- `agarwood-noble-incense-fragrance-oil-1` | Agarwood & noble incense fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `black-cherry-and-corsican-almond-fragrance-oil-2` | Black cherry and corsican almond fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `black-pepper-velvet-orchid-fragrance-oil-1` | Black pepper & velvet orchid fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `black-coconut-fragrance-oil-1` | Black pepper, sandalwood and tonka fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils — Catalog anomaly: handle suggests black-coconut, title points to Black Pepper, Sandalwood and Tonka.
- `by-the-fireplace-fragrance-oil` | By the fireplace fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `cashmere-wood-tonka-fragrance-oil` | Cashmere wood & tonka fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `christmas-hearth-fragrance-oil-1` | Christmas hearth fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `fresh-cotton-green-tea-fragrance-oil-1` | Fresh cotton & green tea fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `fresh-cut-grass-fragrance-oil-1` | Fresh cut grass fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `fresh-cut-peony-fragrance-oil-1` | Fresh cut peony fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `green-cardamom-eucalyptus-fragrance-oil-1` | Green cardamom & eucalyptus fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `green-fig-and-wild-mushroom-fragrance-oil-1` | Green fig and wild mushroom fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `kyoto-matcha-coconut-cloud-fragrance-oil-1` | Kyoto matcha & coconut cloud fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `lavender-peppermint-fragrance-oil` | Lavender & peppermint fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `lemongrass-honey-fragrance-oil` | Lemongrass & honey fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `luscious-lime-basil-fragrance-oil-1` | Luscious lime & basil fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `magnolia-peach-blossom-fragrance-oil` | Magnolia & peach blossom fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `modern-gentleman-fougere-fragrance-oil-1` | Modern gentleman fougère fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `moroccan-cedar-saffron-fragrance-oil` | Moroccan cedar & saffron fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `muscat-fig-fragrance-oil` | Muscat & fig fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `nutmeg-ginger-spice-fragrance-oil-1` | Nutmeg, ginger & spice fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `opium-musk-fragrance-oil-1` | Opium & musk fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `oud-wood-sweet-jasmin-fragrance-oil` | Oud wood & sweet jasmin fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `palo-santo-de-marabi-fragrance-oil-1` | Palo santo de marabi fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `patchouli-vetiver-fragrance-oil-1` | Patchouli & vetiver fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `pineapple-creamy-coconut-fragrance-oil` | Pineapple & creamy coconut fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `pure-jasmine-fragrance-oil` | Pure jasmine fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `rose-champagne-fragrance-oil-2` | Rose & champagne fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `ruby-grapefruit-fragrance-oil-1` | Ruby grapefruit fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `sage-seasalt-fragrance-oil-1` | Sage & seasalt fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `siberian-cedar-bergamot-fragrance-oil` | Siberian cedar & bergamot fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `winter-pines-velvet-petals-fragrance-oil-1` | Sicilian neroli & cashmere fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils — Catalog anomaly: handle suggests Winter Pines & Velvet Petals, title points to Sicilian Neroli & Cashmere.
- `smoky-myrrh-sage-fragrance-oil-1` | Smoky myrrh & sage fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `spiced-apple-cinnamon-fragrance-oil-2` | Spiced apple & cinnamon fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `suede-leather-orris-fragrance-oil-1` | Suede leather & orris fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `sweet-amber-smoke-fragrance-oil` | Sweet amber & smoke fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `tobacco-vanilla-fragrance-oil-1` | Tobacco & vanilla fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `tomato-leaf-fragrance-oil-1` | Tomato leaf fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `vanilla-patchouli-fragrance-oil` | Vanilla & patchouli fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `vanilla-cream-fragrance-oil-1` | Vanilla cream fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `very-gingerbread-fragrance-oil-1` | Very gingerbread fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `very-mango-fragrance-oil` | Very mango fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `wild-fern-moss-fragrance-oil-1` | Wild fern & moss fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `wild-strawberry-cream-silk-fragrance-oil` | Wild strawberry, cream & silk fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils
- `winter-pines-velvet-petals-fragrance-oil` | Winter pines & velvet petals fragrance oil | UNLISTED_SAMPLE | sample_fragrance_oils

## Catalog anomalies to keep visible

- `ecoolive™-pillar-wax` | EcoOlive™ Pillar Wax: Non-standard handle characters present; do not touch handle while working on descriptions.
- `ecosoya™-cb-advanced-container-wax` | EcoSoya™ CB-Advanced Container Wax: Non-standard handle characters present; do not touch handle while working on descriptions.
- `ecosoya™-pillarblend-wax` | EcoSoya™ PillarBlend Wax: Non-standard handle characters present; do not touch handle while working on descriptions.
- `golden-wax™-r45-сontainer-wax` | Golden Wax™ R45+ Сontainer Wax: Non-standard handle characters present; do not touch handle while working on descriptions.
- `golden-wax™-y50-wax-melts-wax` | Golden Wax™ Y50 Wax Melts Wax: Non-standard handle characters present; do not touch handle while working on descriptions.
- `kerasoy™-pillar-wax-4120` | KeraSoy™ Pillar Wax 4120: Non-standard handle characters present; do not touch handle while working on descriptions.
- `naturewax™-c-3-container-soy-wax` | NatureWax™ C-3 Container Soy Wax: Non-standard handle characters present; do not touch handle while working on descriptions.
- `braded-cotton-wicks` | Braded Cotton Wicks: Handle/title typo: Braded Cotton Wicks.
- `tefacid®-stearic-acid` | Tefacid® Stearic Acid: Non-standard handle characters present; do not touch handle while working on descriptions.
- `rooom-spray-bottle-and-sprayer-60ml` | Apothecary Room Spray Bottle and Sprayer, 60 ml: Handle typo: rooom-spray.
- `black-coconut-fragrance-oil-1` | Black pepper, sandalwood and tonka fragrance oil: Catalog anomaly: handle suggests black-coconut, title points to Black Pepper, Sandalwood and Tonka.
- `winter-pines-velvet-petals-fragrance-oil-1` | Sicilian neroli & cashmere fragrance oil: Catalog anomaly: handle suggests Winter Pines & Velvet Petals, title points to Sicilian Neroli & Cashmere.

## Registry file

The operational registry with per-PDP status columns is stored in `data/incidents/PT_PT_PDP_QUEUE_REGISTRY_2026-04-15.tsv`.

