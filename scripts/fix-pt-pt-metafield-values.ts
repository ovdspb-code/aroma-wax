import fs from "node:fs";
import path from "node:path";

import * as cheerio from "cheerio";

import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";

const LOCALE = "pt-PT";
const CANDIDATES_FILE = path.join(process.cwd(), "data", "translation", LOCALE, "import-candidates.json");

type CandidateTranslation = {
  resourceType: string;
  resourceId: string;
  key: string;
  digest: string;
  source: string;
  target: string;
  packet: string;
  packetLine: number;
  existingValue?: string;
  existingOutdated?: boolean;
};

type CandidateFile = {
  generatedAt: string;
  locale: string;
  candidateCount: number;
  candidates: CandidateTranslation[];
};

type TranslationInput = {
  locale: string;
  key: string;
  value: string;
  translatableContentDigest: string;
};

type RegisterResult = {
  translationsRegister: {
    userErrors: Array<{
      field: string[] | null;
      message: string;
    }>;
    translations: Array<{
      key: string;
      value: string;
    }> | null;
  };
};

const translationsRegisterMutation = `
  mutation PtPtMetafieldFixes($resourceId: ID!, $translations: [TranslationInput!]!) {
    translationsRegister(resourceId: $resourceId, translations: $translations) {
      userErrors {
        field
        message
      }
      translations {
        key
        value
      }
    }
  }
`;

const exactTranslations = new Map<string, string>([
  ["All-season", "Todo o ano"],
  ["spring", "primavera"],
  ["summer", "verão"],
  ["autumn", "outono"],
  ["winter", "inverno"],
  ["Christmas", "Natal"],
  ["Floral", "Floral"],
  ["floral", "floral"],
  ["fresh", "fresco"],
  ["green", "verde"],
  ["Gourmand", "Gourmand"],
  ["fruity", "frutado"],
  ["Woody", "Amadeirado"],
  ["woody", "amadeirado"],
  ["oriental", "oriental"],
  ["citrus", "cítrico"],
  ["spicy", "especiado"],
  ["Aquatic", "Aquático"],
  ["aquatic", "aquático"],
  ["herby", "herbal"],
  ["sweet", "doce"],
  ["buttery", "manteigado"],
  ["None", "Nenhum"],
  ["Odor", "Odor"],
  ["Source", "Origem"],
  ["Flash Point", "Ponto de inflamação"],
  ["Flash point", "Ponto de inflamação"],
  ["Carbon Footprint", "Pegada de carbono"],
  ["Maximum Base Load in Diffusers", "Carga máxima de base em difusores"],
  ["Maximum Base Load in Room Sprays", "Carga máxima de base em sprays de ambiente"],
  ["Maximum Fragrance Load", "Carga máxima de fragrância"],
  ["Evaporation", "Evaporação"],
  ["Slight", "ligeiro"],
  ["Renewable (Glycerin-based)", "renovável (à base de glicerina)"],
  ["90% after 45 days", "90% após 45 dias"],
  ["Silver", "Prateado"],
  ["silver", "prateado"],
  ["gold", "dourado"],
  ["Gold", "Dourado"],
  ["white", "branco"],
  ["White", "Branco"],
  ["black", "preto"],
  ["Black", "Preto"],
  ["bronze", "bronze"],
  ["Bronze", "Bronze"],
  ["Amber", "Âmbar"],
  ["transparent", "transparente"],
  ["Transparent", "Transparente"],
  ["Pearls", "Pérolas"],
  ["Red and green apples", "maçãs vermelhas e verdes"],
  ["strawberry", "morango"],
  ["bergamot", "bergamota"],
  ["Cinnamon", "canela"],
  ["cinnamon", "canela"],
  ["cinnamon stick", "pau de canela"],
  ["clove bud", "botão de cravinho"],
  ["clove buds", "botões de cravinho"],
  ["peach", "pêssego"],
  ["honey", "mel"],
  ["vanilla", "baunilha"],
  ["cedar", "cedro"],
  ["Cedar", "Cedro"],
  ["tonka", "fava-tonka"],
  ["orange peel", "casca de laranja"],
  ["Crisp bergamot", "bergamota fresca"],
  ["Blue leaved eucalyptus", "eucalipto de folhas azuladas"],
  ["Green cardamom", "cardamomo verde"],
  ["Dark berries", "frutos silvestres escuros"],
  ["magnolia", "magnólia"],
  ["violet leaf", "folha de violeta"],
  ["pine needle", "agulha de pinheiro"],
  ["Sage leaves", "folhas de sálvia"],
  ["Siberian cedar needle", "agulha de cedro siberiano"],
  ["fir", "abeto"],
  ["cashmere musk", "almíscar de caxemira"],
  ["Perique tobacco", "tabaco Perique"],
  ["neroli", "néroli"],
  ["vanilla husk", "vagem de baunilha"],
  ["Mysore sandalwood", "sândalo de Mysore"],
  ["labdanum", "labdanum"],
  ["crystallized amber", "âmbar cristalizado"],
  ["opoponax", "opopónax"],
  ["Red algae", "algas vermelhas"],
  ["thyme", "tomilho"],
  ["ozone marine", "ozono marinho"],
  ["Sandalwood", "Sândalo"],
  ["sandalwood", "sândalo"],
  ["ambrette seed", "semente de ambreta"],
  ["guaiac wood", "madeira de guáiaco"],
  ["Kaffir lime", "lima kaffir"],
  ["fresh breeze", "brisa fresca"],
  ["mandarin blossom", "flor de tangerineira"],
  ["Garden basil", "manjericão de jardim"],
  ["garden basil", "manjericão de jardim"],
  ["white thyme", "tomilho branco"],
  ["Black pepper", "pimenta-preta"],
  ["black pepper", "pimenta-preta"],
  ["sheer woods", "madeiras leves"],
  ["Black currant", "groselha-preta"],
  ["tangerine", "tangerina"],
  ["leafy greens", "folhagem verde"],
  ["Star anise", "anis-estrelado"],
  ["star anise", "anis-estrelado"],
  ["sambac jasmine", "jasmim sambac"],
  ["pink freesia", "frésia rosa"],
  ["rose", "rosa"],
  ["Cedarwood", "madeira de cedro"],
  ["wild patchouli", "patchouli selvagem"],
  ["nude musk", "almíscar suave"],
  ["lavender", "lavanda"],
  ["lavandin", "lavandim"],
  ["Mint leaves", "folhas de hortelã"],
  ["mint leaves", "folhas de hortelã"],
  ["Smooth musk", "almíscar suave"],
  ["smooth musk", "almíscar suave"],
  ["white patchouli", "patchouli branco"],
  ["Lily", "lírio"],
  ["lily", "lírio"],
  ["lily of the valley", "lírio-do-vale"],
  ["woodland violet", "violeta silvestre"],
  ["pine needles", "agulhas de pinheiro"],
  ["Fresh ginger", "gengibre fresco"],
  ["fresh ginger", "gengibre fresco"],
  ["Sweet milk", "leite doce"],
  ["sweet milk", "leite doce"],
  ["Caramel", "caramelo"],
  ["whipped vanilla", "baunilha batida"],
  ["molasses", "melaço"],
  ["Sun-dried linen", "linho seco ao sol"],
  ["sun-dried linen", "linho seco ao sol"],
  ["Cyclamen", "ciclame"],
  ["violet", "violeta"],
  ["jasmin", "jasmim"],
  ["ylang ylang", "ylang-ylang"],
  ["White cedar", "cedro branco"],
  ["balsam woods", "madeiras balsâmicas"],
  ["White clove", "cravinho branco"],
  ["millsweet lemon", "limão doce"],
  ["Jasmine sambac", "jasmim sambac"],
  ["orange blossom", "flor de laranjeira"],
  ["trumpet lily", "lírio-trombeta"],
  ["tea rose", "rosa de chá"],
  ["Sheer musk", "almíscar leve"],
  ["pear", "pera"],
  ["gardenia", "gardénia"],
  ["White peach", "pêssego branco"],
  ["just squeezed lemon", "limão acabado de espremer"],
  ["Juicy mango", "manga suculenta"],
  ["juicy mango", "manga suculenta"],
  ["sugarcane", "cana-de-açúcar"],
  ["mandarino", "mandarina"],
  ["guava paste", "pasta de goiaba"],
  ["Golden amber", "âmbar dourado"],
  ["light vanilla", "baunilha leve"],
  ["fresh cut eucalyptus", "eucalipto acabado de cortar"],
  ["sage", "sálvia"],
  ["Jasmine petal", "pétala de jasmim"],
  ["princess pine", "pinheiro-princesa"],
  ["may chang", "may chang"],
  ["Blonde cedar", "cedro claro"],
  ["myrrhe", "mirra"],
  ["olibanum", "olíbano"],
  ["Pink grapefruit zest", "raspa de toranja rosa"],
  ["pineapple leaf", "folha de ananás"],
  ["Lime blossom", "flor de lima"],
  ["sun-kissed raspberry", "framboesa amadurecida ao sol"],
  ["Lush greens", "verdes exuberantes"],
  ["Maraschino cherries", "cerejas maraschino"],
  ["coconut flakes", "flocos de coco"],
  ["Buttercream", "creme de manteiga"],
  ["almond", "amêndoa"],
  ["vanilla orchid", "orquídea de baunilha"],
  ["Vanilla cream", "creme de baunilha"],
  ["Lemon zest", "raspa de limão"],
  ["juicy orange", "laranja suculenta"],
  ["Indonesian lemongrass", "erva-príncipe indonésia"],
  ["crushed peppermint", "hortelã-pimenta esmagada"],
  ["White musk", "almíscar branco"],
  ["celery", "aipo"],
  ["Tomato leaf", "folha de tomate"],
  ["Lavender branch", "ramo de lavanda"],
  ["red berry", "baga vermelha"],
  ["water blossoms", "flores aquáticas"],
  ["pineapple", "ananás"],
  ["lime", "lima"],
  ["coconut", "coco"],
  ["Grapefruit", "Toranja"],
  ["grapefruit", "toranja"],
  ["Eucalyptus oil", "óleo de eucalipto"],
  ["eucalyptus oil", "óleo de eucalipto"],
  ["cardamom oil", "óleo de cardamomo"],
  ["Orange oil", "óleo de laranja"],
  ["orange oil", "óleo de laranja"],
  ["Tangerine oil", "óleo de tangerina"],
  ["tangerine oil", "óleo de tangerina"],
  ["Grapefruit oil", "óleo de toranja"],
  ["grapefruit oil", "óleo de toranja"],
  ["Lemon oil", "óleo de limão"],
  ["lemon oil", "óleo de limão"],
  ["Lime oil distilled", "óleo destilado de lima"],
  ["lime oil distilled", "óleo destilado de lima"],
  ["Clove leaf oil", "óleo de folha de cravinho"],
  ["clove leaf oil", "óleo de folha de cravinho"],
  ["Rosemary oil", "óleo de alecrim"],
  ["rosemary oil", "óleo de alecrim"],
  ["Patchouli oil", "óleo de patchouli"],
  ["patchouli oil", "óleo de patchouli"],
  ["Vetiver oil", "óleo de vetiver"],
  ["vetiver oil", "óleo de vetiver"],
  ["Vetiver", "vetiver"],
  ["musk", "almíscar"],
  ["Sage oil", "óleo de sálvia"],
  ["sage oil", "óleo de sálvia"],
  ["Black pepper oil", "óleo de pimenta-preta"],
  ["black pepper oil", "óleo de pimenta-preta"],
  ["Anise oil", "óleo de anis"],
  ["anise oil", "óleo de anis"],
  ["Coriander oil", "óleo de coentro"],
  ["coriander oil", "óleo de coentro"],
  ["Elemi oil", "óleo de elemi"],
  ["elemi oil", "óleo de elemi"],
  ["Siberian fir needle oil", "óleo de agulha de abeto siberiano"],
  ["siberian fir needle oil", "óleo de agulha de abeto siberiano"],
  ["Cedar leaf oil", "óleo de folha de cedro"],
  ["cedar leaf oil", "óleo de folha de cedro"],
  ["pine needle oil", "óleo de agulha de pinheiro"],
  ["bergamot oil", "óleo de bergamota"],
  ["lavandin abrialis oil", "óleo de lavandim abrialis"],
  ["lemongrass oil", "óleo de erva-príncipe"],
  ["peppermint oil", "óleo de hortelã-pimenta"],
  ["cedarwood oil", "óleo de madeira de cedro"],
  ["virginia bergamot oil", "óleo de bergamota da Virgínia"],
  ["ylang ylang oil", "óleo de ylang-ylang"],
  ["litsea cubeba oil", "óleo de litsea cubeba"],
  ["ocimum basilicum flower/leaf/stem extract", "extrato de flor/folha/caule de ocimum basilicum"],
  ["Citrus medica limonum (lemon) peel oil", "óleo de casca de Citrus medica limonum (limão)"],
  ["citrus medica limonum (lemon) peel oil", "óleo de casca de Citrus medica limonum (limão)"],
  ["cupressus funebris wood oil", "óleo de madeira de cupressus funebris"],
  ["cistus oil (labdanum oil)", "óleo de cisto (óleo de labdanum)"],
  ["opoponax resinoid", "resinoide de opopónax"],
  ["cedrambr", "cedrambr"],
  ["sandal mysore core", "madeira de sândalo de Mysore"],
  ["olibanum oil (frankincense)", "óleo de olíbano (incenso)"],
  ["artemisia vulgaris oil", "óleo de Artemisia vulgaris"],
  ["Dark red/burgundy", "vermelho-escuro/bordeaux"],
  ["Pumpkin orange", "laranja abóbora"],
  ["Golden honey", "mel dourado"],
  ["Siberian green", "verde siberiano"],
  ["Cedarwood brown", "castanho madeira de cedro"],
  ["Pine needle green", "verde agulha de pinheiro"],
  ["Deep wood brown", "castanho madeira profundo"],
  ["Deep Forest Green", "verde floresta profundo"],
  ["Ash grey", "cinzento-cinza"],
  ["Charcoal Grey", "cinzento carvão"],
  ["Olive green", "verde azeitona"],
  ["Tobacco brown", "castanho tabaco"],
  ["Creamy vanilla", "baunilha cremosa"],
  ["Warm ivory", "marfim quente"],
  ["Sage green", "verde sálvia"],
  ["Seasalt grey", "cinzento sal marinho"],
  ["Aqua mist", "névoa aqua"],
  ["Zesty Lime Green", "verde lima vibrante"],
  ["Fresh Basil Green", "verde manjericão fresco"],
  ["Herbal Olive", "azeitona herbal"],
  ["Deep Burgundy", "bordeaux profundo"],
  ["Musk Brown", "castanho almíscar"],
  ["Opium Red", "vermelho ópio"],
  ["Lavender Purple", "roxo lavanda"],
  ["Smoked Lavender", "lavanda fumada"],
  ["Soft Lavender", "lavanda suave"],
  ["Dusty Purple", "roxo empolvado"],
  ["Earthy Brown", "castanho terroso"],
  ["Patchouli Green", "verde patchouli"],
  ["Vetiver Brown", "castanho vetiver"],
  ["Fresh Cut Peony", "peónia recém-cortada"],
  ["Peony Petals", "pétalas de peónia"],
  ["Pink Peony —", "peónia rosa —"],
  ["Pink Peony", "peónia rosa"],
  ["Gingerbread Brown", "castanho gengibre"],
  ["Spicy Orange", "laranja especiada"],
  ["Warm Cinnamon", "canela quente"],
  ["Coconut Cream", "creme de coco"],
  ["Spicy Pepper", "pimenta especiada"],
  ["Warm Sandalwood", "sândalo quente"],
  ["Mango Orange", "laranja manga"],
  ["Tropical Yellow", "amarelo tropical"],
  ["Fresh Mango Flesh", "polpa de manga fresca"],
  ["Smoky Resin Brown", "castanho resina fumada"],
  ["Earthy Myrrh", "mirra terrosa"],
  ["Sage Grey-Green", "verde-acinzentado sálvia"],
  ["Ruby Red", "vermelho rubi"],
  ["Grapefruit Flesh", "polpa de toranja"],
  ["Citrus Pink", "rosa cítrico"],
  ["Vanilla Latte", "latte de baunilha"],
  ["Creme Brûlée", "creme brûlée"],
  ["Buttery Cream", "creme amanteigado"],
  ["Zesty Lemongrass", "erva-príncipe vibrante"],
  ["Fresh Citrus Green", "verde cítrico fresco"],
  ["Eucalyptus Green", "verde eucalipto"],
  ["Fresh Cardamom", "cardamomo fresco"],
  ["Herbal Sage", "sálvia herbal"],
  ["Creamy Beeswax", "cera de abelha cremosa"],
  ["Tomato Leaf Green", "verde folha de tomate"],
  ["Garden Herb Green", "verde ervas de jardim"],
  ["Crisp Basil", "manjericão fresco"],
  ["Woody Brown", "castanho amadeirado"],
  ["Cashmere Beige", "bege caxemira"],
  ["Soft Amber", "âmbar suave"],
  ["Tropical Pineapple", "ananás tropical"],
  ["Creamy Coconut", "coco cremoso"],
  ["Sunlight Yellow", "amarelo luz do sol"],
  ["Soft Cotton White", "branco algodão suave"],
  ["Antique Silver", "prateado antigo"],
  ["Frosty Blue", "azul gelado"],
  ["Cool Breeze", "brisa fresca"],
  ["Soft Green", "verde suave"],
  ["Creamy Beige", "bege cremoso"],
  ["Golden Yellow", "amarelo dourado"],
  ["Warm Gray", "cinzento quente"],
  ["Coconut and berries", "coco e bagas frescas"],
  ["Matcha and violet petals", "matcha e pétalas de violeta"],
  ["Cedarwood oil", "óleo de madeira de cedro"],
  ["carrot seed oil", "óleo de semente de cenoura"],
  ["Pine needles and citrus", "agulhas de pinheiro e citrinos"],
  ["eucalyptus and freesia", "eucalipto e frésia"],
  ["Tobacco and warm incense", "tabaco e incenso quente"],
  ["geranium", "gerânio"],
  ["Agarwood and oakmoss", "agarwood e musgo de carvalho"],
  ["oakmoss", "musgo de carvalho"],
  ["sueded leather and resin", "couro acamurçado e resina"],
  ["sueded leather", "couro acamurçado"],
  ["resin", "resina"],
  ["Almond blossom and pink apples", "flor de amendoeira e maçãs rosadas"],
  ["Wild strawberries and peony blossom", "morangos silvestres e flor de peónia"],
  ["Vanilla, musk and silk", "baunilha, almíscar e seda"],
  ["silk", "seda"],
  ["Vibrant Green", "verde vibrante"],
  ["Cream", "creme"],
  ["Light Beige", "bege claro"],
  ["Teal", "verde-petróleo"],
  ["Deep Oud Brown", "castanho oud profundo"],
  ["Smoked Amber", "âmbar fumado"],
  ["Charcoal Black", "preto carvão"],
  ["Antique Gold", "dourado antigo"],
  ["Strawberry Red", "vermelho morango"],
  ["Soft Cream", "creme suave"],
  ["Blush Pink", "rosa suave"],
  ["Silk Ivory", "marfim sedoso"],
  ["ST, ECO, TCR, wooden wicks", "ST, ECO, TCR, pavios de madeira"],
  ["Bronze, silver, gold, white or black", "bronze, prateado, dourado, branco ou preto"],
  ["Bronze, silver, gold, white and black", "bronze, prateado, dourado, branco e preto"],
  ["Black, silver", "preto, prateado"],
  ["Silver, black", "prateado, preto"],
  ["Gold or silver", "dourado ou prateado"],
  ["Amber or transparent", "âmbar ou transparente"],
  ["velas", "velas"],
  ["Allergen Declaration for", "Declaração de alergénios de"],
  ["Safety Data Sheet for", "Ficha de Dados de Segurança de"],
  ["IFRA Sheet for", "Ficha IFRA de"],
]);

const englishMarkers = [...exactTranslations.keys()]
  .filter((entry) => /[A-Za-z]/.test(entry))
  .map((entry) => entry.toLowerCase())
  .sort((left, right) => right.length - left.length);

function loadCandidates() {
  if (!fs.existsSync(CANDIDATES_FILE)) {
    throw new Error(`Missing ${path.relative(process.cwd(), CANDIDATES_FILE)}. Run npm run i18n:plan-import first.`);
  }

  const payload = JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf8")) as CandidateFile;

  if (payload.locale !== LOCALE) {
    throw new Error(`Expected locale ${LOCALE}, got ${payload.locale}.`);
  }

  return payload.candidates;
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function splitOutsideParentheses(text: string, separator: "," | " and " | " or ") {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === "(") {
      depth += 1;
    } else if (character === ")" && depth > 0) {
      depth -= 1;
    }

    if (depth === 0 && text.slice(index, index + separator.length).toLowerCase() === separator) {
      parts.push(current.trim());
      current = "";
      index += separator.length - 1;
      continue;
    }

    current += character;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function translateExact(text: string) {
  return exactTranslations.get(text) ?? null;
}

function joinTranslatedParts(parts: string[], translatedSeparator: string) {
  if (parts.length <= 1) {
    return null;
  }

  const translatedParts = parts.map((part) => translateSegment(part));
  const anyChanged = translatedParts.some((part, index) => part !== parts[index]);

  if (!anyChanged) {
    return null;
  }

  return translatedParts.join(translatedSeparator);
}

function translateSegment(text: string): string {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return normalized;
  }

  const exact = translateExact(normalized);

  if (exact) {
    return exact;
  }

  const pantoneMatch = normalized.match(/^(.+?)\s*(\((?:Pantone|#).+\))$/);

  if (pantoneMatch) {
    const translatedHead = translateSegment(pantoneMatch[1]);

    if (translatedHead !== pantoneMatch[1]) {
      return `${translatedHead} ${pantoneMatch[2]}`;
    }
  }

  const commaParts = splitOutsideParentheses(normalized, ",");

  const translatedComma = joinTranslatedParts(commaParts, ", ");

  if (translatedComma) {
    return translatedComma;
  }

  const andParts = splitOutsideParentheses(normalized, " and ");

  const translatedAnd = joinTranslatedParts(andParts, " e ");

  if (translatedAnd) {
    return translatedAnd;
  }

  const ptAndParts = splitOutsideParentheses(normalized, " e ");
  const translatedPtAnd = joinTranslatedParts(ptAndParts, " e ");

  if (translatedPtAnd) {
    return translatedPtAnd;
  }

  const orParts = splitOutsideParentheses(normalized, " or ");

  const translatedOr = joinTranslatedParts(orParts, " ou ");

  if (translatedOr) {
    return translatedOr;
  }

  const ptOrParts = splitOutsideParentheses(normalized, " ou ");
  const translatedPtOr = joinTranslatedParts(ptOrParts, " ou ");

  if (translatedPtOr) {
    return translatedPtOr;
  }

  return normalized;
}

function translateText(text: string) {
  const leading = text.match(/^\s*/)?.[0] ?? "";
  const trailing = text.match(/\s*$/)?.[0] ?? "";
  const core = normalizeWhitespace(text);

  if (!core) {
    return text;
  }

  const lowerCore = core.toLowerCase();

  if (!englishMarkers.some((marker) => lowerCore.includes(marker))) {
    return text;
  }

  const translated = translateSegment(core);
  return translated === core ? text : `${leading}${translated}${trailing}`;
}

function renderFragment($: cheerio.CheerioAPI) {
  return $.root()
    .contents()
    .toArray()
    .map((node) => $.html(node))
    .join("");
}

function transformHtml(value: string) {
  const $ = cheerio.load(value, { decodeEntities: false }, false);
  const root = $.root()[0];
  let changed = false;

  function visit(node: cheerio.AnyNode, insideLabel = false) {
    if (node.type === "text") {
      const parentNode = node.parent;
      const isListItemLabel =
        parentNode?.type === "tag" &&
        (parentNode.name === "b" || parentNode.name === "strong") &&
        parentNode.parent?.type === "tag" &&
        parentNode.parent.name === "li";

      if ((!insideLabel || isListItemLabel) && node.data) {
        const nextData = translateText(node.data);

        if (nextData !== node.data) {
          node.data = nextData;
          changed = true;
        }
      }

      return;
    }

    const nextInsideLabel =
      insideLabel || ("name" in node && (node.name === "b" || node.name === "strong"));

    if ("attribs" in node && node.attribs?.title) {
      const nextTitle = translateText(node.attribs.title);

      if (nextTitle !== node.attribs.title) {
        node.attribs.title = nextTitle;
        changed = true;
      }
    }

    if ("children" in node && node.children) {
      for (const child of node.children) {
        visit(child, nextInsideLabel);
      }
    }
  }

  visit(root);
  return changed ? renderFragment($) : value;
}

function transformValue(raw: string) {
  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    return raw;
  }

  return transformHtml(raw);
}

function groupByResource(candidates: Array<CandidateTranslation & { nextValue: string }>) {
  const grouped = new Map<string, Array<CandidateTranslation & { nextValue: string }>>();

  for (const candidate of candidates) {
    const existing = grouped.get(candidate.resourceId) ?? [];
    existing.push(candidate);
    grouped.set(candidate.resourceId, existing);
  }

  return [...grouped.entries()].map(([resourceId, translations]) => ({
    resourceId,
    translations,
  }));
}

async function registerTranslations(resourceId: string, translations: TranslationInput[]) {
  return shopifyAdminFetch<RegisterResult>(translationsRegisterMutation, {
    resourceId,
    translations,
  });
}

async function main() {
  const apply = process.argv.includes("--apply");
  const candidates = loadCandidates()
    .filter(
      (candidate) =>
        candidate.resourceType === "METAFIELD" &&
        candidate.key === "value" &&
        typeof candidate.existingValue === "string" &&
        /<[a-z][\s\S]*>/i.test(candidate.existingValue),
    )
    .map((candidate) => {
      const nextValue = transformValue(candidate.existingValue!);
      return {
        ...candidate,
        nextValue,
      };
    })
    .filter((candidate) => candidate.nextValue !== candidate.existingValue);

  console.log(`Mode: ${apply ? "apply" : "dry-run"}`);
  console.log(`Eligible METAFIELD fixes: ${candidates.length}`);

  for (const candidate of candidates.slice(0, 12)) {
    console.log(`- ${candidate.resourceId}`);
    console.log(`  before: ${candidate.existingValue?.slice(0, 220)}`);
    console.log(`  after:  ${candidate.nextValue.slice(0, 220)}`);
  }

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to register these metafield translation fixes.");
    return;
  }

  const grouped = groupByResource(candidates);
  let written = 0;

  for (const group of grouped) {
    const result = await registerTranslations(
      group.resourceId,
      group.translations.map((candidate) => ({
        locale: LOCALE,
        key: candidate.key,
        value: candidate.nextValue,
        translatableContentDigest: candidate.digest,
      })),
    );

    if (result.translationsRegister.userErrors.length) {
      throw new Error(
        result.translationsRegister.userErrors
          .map((error) => `${error.field?.join(".") ?? "translationsRegister"}: ${error.message}`)
          .join("\n"),
      );
    }

    written += group.translations.length;
  }

  console.log(`Registered metafield fixes: ${written}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
