from __future__ import annotations

import io
import json
import re
import shutil
import subprocess
import textwrap
import urllib.parse
import urllib.request
import unicodedata
from urllib.error import HTTPError
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

import pdfplumber
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    LongTable,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfgen import canvas


ROOT = Path("/Users/ovd/Documents/AROMA_AND_WAX")
ZIP_PATH = ROOT / "original_sds.zip"
SAMPLE_PDF = ROOT / "FO_139_WINTER_PINES_&_VELVET_PETALS_English3_1_20250815141430.pdf"
SDK_DIR = ROOT / "SDK"
SOURCE_DIR = SDK_DIR / "source" / "original_sds"
WORK_DIR = ROOT / "tmp" / "sds_sdk"
ASSET_DIR = WORK_DIR / "assets"
CACHE_PATH = WORK_DIR / "translate_cache.json"

GREEN = colors.Color(0.475, 0.541, 0.384)
LIGHT_GREEN = colors.Color(0.93, 0.95, 0.90)
BLACK = colors.black
GRAY = colors.Color(0.35, 0.35, 0.35)
BLUE_TUPLE = (0.0, 0.439, 0.753)


PRODUCTS = {
    "forest": {
        "old_code": "EU32173F",
        "old_names": [
            "FOREST FIG #EU32173F",
            "FOREST FIG",
            "Forest Fig #EU32173F",
            "Forest Fig",
        ],
        "new_code": "FO-148",
        "new_code_fs": "FO_148",
        "ufi": "JNEQ-9C93-0SDS-YXQ4",
        "names": {
            "English": "TRUE FIG",
            "French": "VRAIE FIGUE",
            "German": "ECHTE FEIGE",
            "Portuguese": "FIGO VERDADEIRO",
            "Spanish": "HIGO VERDADERO",
        },
        "source_langs": {
            "English": "EU32173F SDS EU FOREST FIG #EU32173F English2.0.pdf",
            "French": "EU32173F SDS EU FOREST FIG #EU32173F French2.0.pdf",
            "German": "EU32173F SDS EU FOREST FIG #EU32173F German2.0.pdf",
            "Portuguese": "EU32173F SDS EU FOREST FIG #EU32173F Portuguese2.0.pdf",
            "Spanish": "EU32173F SDS EU FOREST FIG #EU32173F Spanish2.0.pdf",
        },
    },
    "smoking": {
        "old_code": "EU27276F",
        "old_names": [
            "SMOKING MARIJUANA #EU27276F",
            "Smoking Marijuana #EU27276F",
            "SMOKING MARIJUANA",
            "Smoking Marijuana",
        ],
        "new_code": "FO-149",
        "new_code_fs": "FO_149",
        "ufi": "2KEQ-SCKP-QSD9-9M42",
        "names": {
            "English": "SOFT CANNABIS",
            "French": "CANNABIS DOUX",
            "German": "SANFTES CANNABIS",
            "Portuguese": "CANNABIS SUAVE",
            "Spanish": "CANNABIS SUAVE",
        },
        "source_langs": {
            "English": "EU27276F SDS EU Smoking Marijuana #EU27276F English2.0.pdf",
            "French": "EU27276F SDS EU Smoking Marijuana #EU27276F French1.0.pdf",
            "German": "EU27276F SDS EU Smoking Marijuana #EU27276F German1.0.pdf",
            "Portuguese": "EU27276F SDS EU Smoking Marijuana #EU27276F Portuguese1.0.pdf",
            "Spanish": "EU27276F SDS EU Smoking Marijuana #EU27276F Spanish1.0.pdf",
        },
    },
    "damask": {
        "old_code": "EU55162F",
        "old_names": [
            "DAMASK ROSE & HIBISCUS NECTAR #EU55162F",
            "DAMASK ROSE & HIBISCUS NECTAR",
            "Damask Rose & Hibiscus Nectar #EU55162F",
            "Damask Rose & Hibiscus Nectar",
            "Damask Rose",
        ],
        "new_code": "FO-147",
        "new_code_fs": "FO_147",
        "ufi": "GGEQ-8CW9-DSDT-N8J0",
        "names": {
            "English": "ROSE HIBISCUS BERRIES",
            "French": "BAIES D'HIBISCUS ROSE",
            "German": "ROSEN-HIBISKUS-BEEREN",
            "Portuguese": "BAGAS DE HIBISCO ROSA",
            "Spanish": "BAYAS DE HIBISCO ROSA",
        },
        "source_langs": {
            "English": "EU55162F SDS EU DAMASK ROSE & HIBISCUS NECTAR #EU55162F English1.0.pdf",
            "French": "EU55162F SDS EU DAMASK ROSE & HIBISCUS NECTAR #EU55162F French1.0.pdf",
            "German": "EU55162F SDS EU DAMASK ROSE & HIBISCUS NECTAR #EU55162F German1.0.pdf",
            "Portuguese": "EU55162F SDS EU DAMASK ROSE & HIBISCUS NECTAR #EU55162F English1.0.pdf",
            "Spanish": "EU55162F SDS EU DAMASK ROSE & HIBISCUS NECTAR #EU55162F Spanish1.0.pdf",
        },
    },
}


LANGUAGES = {
    "English": {
        "footer": "EN (English)",
        "fragrance": "FRAGRANCE OIL",
        "tagline": "for professionals",
        "supplier_line": "AROMA + WAX for professionals",
        "tl": "en",
        "source_lang": "en",
    },
    "French": {
        "footer": "FR (francais)",
        "fragrance": "HUILE PARFUMEE",
        "tagline": "for professionals",
        "supplier_line": "AROMA + WAX for professionals",
        "tl": "fr",
        "source_lang": "fr",
    },
    "German": {
        "footer": "DE (Deutsch)",
        "fragrance": "DUFTOEL",
        "tagline": "for professionals",
        "supplier_line": "AROMA + WAX for professionals",
        "tl": "de",
        "source_lang": "de",
    },
    "Portuguese": {
        "footer": "PT (Portugues)",
        "fragrance": "OLEO PERFUMADO",
        "tagline": "para profissionais",
        "supplier_line": "AROMA + WAX para profissionais",
        "tl": "pt-PT",
        "source_lang": "pt",
    },
    "Spanish": {
        "footer": "ES (espanol)",
        "fragrance": "ACEITE PERFUMADO",
        "tagline": "for professionals",
        "supplier_line": "AROMA + WAX for professionals",
        "tl": "es",
        "source_lang": "es",
    },
}


SECTION_RE = re.compile(r"^(SECTION|SECÇÃO|SECCIÓN|ABSCHNITT|RUBRIQUE)\s+\d+", re.I)
NUMBERED_RE = re.compile(r"^(\d+(?:\.\d+)+)\.?\s+(.+)$")
HCODE_RE = re.compile(r"^(.*?)\s+(H\d{3})$")
BOXED_SUBSECTIONS = {"1.1", "1.2.1"}
SUPPLIER_BLOCK = [
    "Aroma and Wax, S.L.",
    "08290 Avinguda del Parc Tecnologico, 7,",
    "Cerdanyola del Valles, Barcelona, Espana",
    "+34 614 410 662",
    "https://aromawax.eu",
]


@dataclass
class ParsedLine:
    text: str
    top: float
    x0: float
    bold: bool
    color: tuple[float, ...]


@dataclass
class Block:
    kind: str
    text: str | None = None
    rows: list[list[str]] | None = None
    col_widths: list[float] | None = None
    subsection: str | None = None
    source_blue: bool = False
    bold: bool = False


@dataclass
class DocumentModel:
    product_key: str
    language: str
    header_sds_title: str
    header_regulation: str
    header_meta: str
    footer_language: str
    blocks: list[Block] = field(default_factory=list)
    hazard_codes: set[str] = field(default_factory=set)


def run(cmd: list[str], cwd: Path | None = None) -> None:
    subprocess.run(cmd, cwd=cwd, check=True)


def ensure_dirs() -> None:
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    SDK_DIR.mkdir(parents=True, exist_ok=True)


def unzip_sources() -> None:
    if any(SOURCE_DIR.glob("*.pdf")):
        return
    run(["unzip", "-o", str(ZIP_PATH), "*.pdf", "-d", str(SOURCE_DIR)])


def ensure_sample_assets() -> dict[str, Path]:
    prefix = ASSET_DIR / "sample_img"
    hazard_07 = ASSET_DIR / "ghs07.png"
    hazard_09 = ASSET_DIR / "ghs09.png"
    transport = ASSET_DIR / "transport_class9_env.png"
    if not all(p.exists() for p in [hazard_07, hazard_09, transport]):
        run(["pdfimages", "-png", str(SAMPLE_PDF), str(prefix)])
        extracted = sorted(ASSET_DIR.glob("sample_img-*.png"))
        by_name = {p.name: p for p in extracted}
        shutil.copy2(by_name["sample_img-004.png"], hazard_07)
        shutil.copy2(by_name["sample_img-005.png"], hazard_09)
        shutil.copy2(by_name["sample_img-026.png"], transport)
    return {"ghs07": hazard_07, "ghs09": hazard_09, "transport": transport}


def load_cache() -> dict[str, str]:
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text())
    return {}


TRANSLATE_CACHE = load_cache()


def save_cache() -> None:
    CACHE_PATH.write_text(json.dumps(TRANSLATE_CACHE, ensure_ascii=False, indent=2))


def translate_google(text: str, src: str, target: str) -> str:
    text = text.strip()
    if not text:
        return text
    if len(text) > 700:
        parts = split_for_translation(text)
        return "\n".join(translate_google(part, src, target) for part in parts if part.strip())
    cache_key = f"{src}|{target}|{text}"
    if cache_key in TRANSLATE_CACHE:
        return TRANSLATE_CACHE[cache_key]
    url = (
        "https://translate.googleapis.com/translate_a/single?"
        f"client=gtx&sl={urllib.parse.quote(src)}&tl={urllib.parse.quote(target)}&dt=t&q={urllib.parse.quote(text)}"
    )
    last_error = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(url, timeout=30) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            break
        except HTTPError as exc:
            last_error = exc
            if len(text) > 280:
                parts = split_for_translation(text)
                translated = "\n".join(translate_google(part, src, target) for part in parts if part.strip())
                TRANSLATE_CACHE[cache_key] = translated
                return translated
    else:
        raise last_error if last_error else RuntimeError("Translation failed")
    translated = "".join(part[0] for part in payload[0])
    TRANSLATE_CACHE[cache_key] = translated
    return translated


def split_for_translation(text: str, limit: int = 320) -> list[str]:
    lines = text.split("\n")
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0
    for line in lines:
        pieces = [line] if len(line) <= limit else re.split(r"(?<=[.;:])\s+", line)
        for piece in pieces:
            piece = piece.strip()
            if not piece:
                continue
            piece_len = len(piece)
            if current and current_len + piece_len + 1 > limit:
                chunks.append("\n".join(current))
                current = [piece]
                current_len = piece_len
            else:
                current.append(piece)
                current_len += piece_len + 1
    if current:
        chunks.append("\n".join(current))
    return chunks


def clean_text(text: str) -> str:
    text = text.replace("\x0c", " ").replace("\u00a0", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def dominant_color(chars: list[dict]) -> tuple[float, ...]:
    counter: Counter[tuple[float, ...]] = Counter()
    for ch in chars:
        if not ch["text"].strip():
            continue
        color = ch.get("non_stroking_color") or (0.0,)
        if isinstance(color, list):
            color = tuple(color)
        elif not isinstance(color, tuple):
            color = (float(color),)
        counter[color] += 1
    return counter.most_common(1)[0][0] if counter else (0.0,)


def is_bold(chars: list[dict]) -> bool:
    total = 0
    bold = 0
    for ch in chars:
        if not ch["text"].strip():
            continue
        total += 1
        if "Bold" in ch["fontname"]:
            bold += 1
    return total > 0 and bold / total > 0.5


def is_blue(color: tuple[float, ...]) -> bool:
    return len(color) >= 3 and all(abs(color[i] - BLUE_TUPLE[i]) < 0.02 for i in range(3))


def table_col_widths(table: pdfplumber.table.Table) -> list[float]:
    xs: set[float] = set()
    for cell in table.cells:
        if cell is None:
            continue
        xs.add(cell[0])
        xs.add(cell[2])
    ordered = sorted(xs)
    return [ordered[idx + 1] - ordered[idx] for idx in range(len(ordered) - 1)]


def normalize_table_rows(rows: list[list[str | None]]) -> list[list[str]]:
    cleaned = []
    for row in rows:
        cleaned.append([clean_text(cell or "") for cell in row])
    cleaned = [row for row in cleaned if any(cell for cell in row)]
    if len(cleaned) >= 2 and all(cleaned[0]):
        merged = cleaned[0][:]
        idx = 1
        while idx < len(cleaned):
            nonempty = [i for i, cell in enumerate(cleaned[idx]) if cell]
            if nonempty and nonempty[0] == 0:
                break
            if len(nonempty) <= 1:
                for col in nonempty:
                    merged[col] = (merged[col] + "\n" + cleaned[idx][col]).strip()
                idx += 1
            else:
                break
        cleaned = [merged] + cleaned[idx:]
    return cleaned


def extract_header_info(page: pdfplumber.page.Page) -> tuple[str, str, str]:
    lines = [
        clean_text(line["text"])
        for line in page.extract_text_lines(layout=True, strip=False, return_chars=False)
        if clean_text(line["text"])
    ]
    header_lines = []
    for line in lines:
        if SECTION_RE.match(line):
            break
        header_lines.append(line)
    if len(header_lines) < 3:
        raise RuntimeError("Could not extract header info")
    return header_lines[-3], header_lines[-2], header_lines[-1]


def line_overlaps_table(line: ParsedLine, tables: list[pdfplumber.table.Table]) -> bool:
    for table in tables:
        x0, top, x1, bottom = table.bbox
        if top - 2 <= line.top <= bottom + 2:
            return True
    return False


def extract_line_items(page: pdfplumber.page.Page, page_number: int) -> tuple[list[ParsedLine], list[pdfplumber.table.Table]]:
    tables = page.find_tables()
    raw_lines = page.extract_text_lines(layout=True, strip=False, return_chars=True)
    lines: list[ParsedLine] = []
    first_section_top = None
    for raw in raw_lines:
        text = clean_text(raw["text"])
        if SECTION_RE.match(text):
            first_section_top = raw["top"]
            break
    header_cutoff = (first_section_top - 2) if page_number == 1 and first_section_top else 90
    footer_cutoff = page.height - 55
    for raw in raw_lines:
        text = clean_text(raw["text"])
        if not text:
            continue
        if raw["top"] < header_cutoff:
            continue
        if raw["top"] > footer_cutoff:
            continue
        line = ParsedLine(
            text=text,
            top=raw["top"],
            x0=raw["x0"],
            bold=is_bold(raw["chars"]),
            color=dominant_color(raw["chars"]),
        )
        if line_overlaps_table(line, tables):
            continue
        lines.append(line)
    return lines, tables


def start_kv_group(blocks: list[Block], subsection: str | None) -> Block:
    block = Block(kind="kv", rows=[], subsection=subsection)
    blocks.append(block)
    return block


def add_kv_row(block: Block, left: str, right: str) -> None:
    assert block.rows is not None
    block.rows.append([clean_text(left), clean_text(right)])


def build_blocks(pages: list[tuple[list[ParsedLine], list[pdfplumber.table.Table]]]) -> tuple[list[Block], set[str]]:
    blocks: list[Block] = []
    hazard_codes: set[str] = set()
    current_subsection: str | None = None
    current_kv: Block | None = None
    current_para: list[str] = []
    current_para_bold = False

    def flush_para() -> None:
        nonlocal current_para, current_para_bold
        if current_para:
            blocks.append(
                Block(
                    kind="paragraph",
                    text=" ".join(current_para).strip(),
                    subsection=current_subsection,
                    bold=current_para_bold,
                )
            )
            current_para = []
            current_para_bold = False

    def flush_kv() -> None:
        nonlocal current_kv
        current_kv = None

    for lines, tables in pages:
        items: list[tuple[float, str, object]] = []
        for line in lines:
            items.append((line.top, "line", line))
        for table in tables:
            items.append((table.bbox[1], "table", table))
        items.sort(key=lambda item: item[0])
        for _, kind, payload in items:
            if kind == "table":
                flush_para()
                flush_kv()
                table = payload
                blocks.append(
                    Block(
                        kind="table",
                        rows=normalize_table_rows(table.extract()),
                        col_widths=table_col_widths(table),
                        subsection=current_subsection,
                    )
                )
                continue

            line: ParsedLine = payload
            text = line.text
            if SECTION_RE.match(text):
                flush_para()
                flush_kv()
                current_subsection = None
                blocks.append(Block(kind="section", text=text))
                continue

            numbered = NUMBERED_RE.match(text)
            if numbered:
                flush_para()
                flush_kv()
                current_subsection = numbered.group(1)
                blocks.append(Block(kind="subsection", text=text, subsection=current_subsection))
                continue

            if is_blue(line.color) and line.bold:
                flush_para()
                flush_kv()
                blocks.append(
                    Block(
                        kind="minor_heading",
                        text=text,
                        subsection=current_subsection,
                        source_blue=True,
                    )
                )
                continue

            if line.bold and not is_blue(line.color):
                flush_para()
                flush_kv()
                blocks.append(
                    Block(
                        kind="paragraph",
                        text=text,
                        subsection=current_subsection,
                        bold=True,
                    )
                )
                continue

            kv_match = re.match(r"^(.*?)\s*:\s*(.*)$", text)
            hcode_match = HCODE_RE.match(text)
            if kv_match and len(kv_match.group(1)) < 140:
                flush_para()
                if current_kv is None:
                    current_kv = start_kv_group(blocks, current_subsection)
                add_kv_row(current_kv, kv_match.group(1), kv_match.group(2))
                for code in re.findall(r"H\d{3}", text):
                    hazard_codes.add(code)
                continue
            if hcode_match and len(hcode_match.group(1)) < 180:
                flush_para()
                if current_kv is None:
                    current_kv = start_kv_group(blocks, current_subsection)
                add_kv_row(current_kv, hcode_match.group(1), hcode_match.group(2))
                hazard_codes.add(hcode_match.group(2))
                continue

            if current_kv is not None and line.x0 > 70 and current_kv.rows:
                current_kv.rows[-1][1] = (current_kv.rows[-1][1] + "\n" + text).strip()
                for code in re.findall(r"H\d{3}", text):
                    hazard_codes.add(code)
                continue

            flush_kv()
            if current_para:
                current_para.append(text)
            else:
                current_para = [text]
                current_para_bold = False
            for code in re.findall(r"H\d{3}", text):
                hazard_codes.add(code)

    flush_para()
    flush_kv()
    return blocks, hazard_codes


def text_replacements(product_key: str, language: str) -> dict[str, str]:
    product = PRODUCTS[product_key]
    trade_name = f"{product['names'][language]} {product['new_code']}"
    mapping = {
        "__TRADE_NAME__": trade_name,
        "__PRODUCT_CODE__": product["new_code"],
        "__UFI__": product["ufi"],
    }
    return mapping


def protect_text(text: str, product_key: str) -> str:
    product = PRODUCTS[product_key]
    protected = text
    for old_name in sorted(product["old_names"], key=len, reverse=True):
        protected = protected.replace(old_name, "__TRADE_NAME__")
    protected = protected.replace(f"#{product['old_code']}", "__PRODUCT_CODE__")
    protected = re.sub(rf"\b{re.escape(product['old_code'])}\b", "__PRODUCT_CODE__", protected)
    for ufi in [
        "863V-32DA-U00D-W54K",
        "WSHE-J2CA-X00X-KEHN",
        "VWRW-N4YF-2008-U3ER",
    ]:
        protected = protected.replace(ufi, "__UFI__")
    return protected


def unprotect_text(text: str, product_key: str, language: str) -> str:
    mapping = text_replacements(product_key, language)
    for key, value in mapping.items():
        text = text.replace(key, value)
    return text


PT_PATCHES = {
    "according to the REACH Regulation (EC) 1907/2006 amended by Regulation (EU) 2020/878": "de acordo com o Regulamento REACH (Regulamento (CE) n.o 1907/2006) alterado pelo Regulamento (UE) 2020/878",
    "Classification according to": "Classificação de acordo com",
    "com Regulation (EC) No.": "com o Regulamento (CE) n.º",
    "Regulation (EC) No.": "Regulamento (CE) n.º",
    "Classification according to Regulation (EC) No. 1272/2008 [CLP]": "Classificação de acordo com o Regulamento (CE) n.º 1272/2008 [CLP]",
    "Classification according to Regulation (EC) No 1272/2008": "Classificação de acordo com o Regulamento (CE) n.º 1272/2008",
    "Regulation (EC) No 1272/2008": "Regulamento (CE) n.º 1272/2008",
    "Hazard classes": "classes de perigo",
    "Hazard class": "classe de perigo",
    "Contains no PBT and/or vPvB substances >= 0.1% assessed in accordance with REACH Annex XIII": "Nao contem substancias PBT e/ou mPmB >= 0,1 % avaliadas em conformidade com o anexo XIII do REACH",
    "Contains no PBT and/or vPvB substances ≥ 0.1% assessed in accordance with REACH Annex XIII": "Nao contem substancias PBT e/ou mPmB >= 0,1 % avaliadas em conformidade com o anexo XIII do REACH",
    "Odour agents": "Agentes odorizantes",
    "Agentes de odor": "Agentes odorizantes",
    "Para profissional usar apenas.": "Apenas para uso profissional.",
    "Industriais.": "Industrial",
    "Agua pulverizada": "Agua pulverizada",
    "Nunca dar qualquer coisa por boca para um inconsciente pessoa.": "Nunca dar nada por via oral a uma pessoa inconsciente.",
    "Consentir a vitima descansar.": "Deixar a vitima em repouso.",
    "informaçoes": "informacoes",
    "exposiçao-protecção individual": "exposicao-protecao individual",
    "Brazil": "Brasil",
    "Mexico": "Mexico",
}


PT_TRANSLATE_IF_CONTAINS = [
    "according to the REACH Regulation",
    "Contains no PBT",
    "Odour agents",
    "Contains ",
    "Issue date",
    "Revision date",
    "Supersedes",
    "Ozone Depletion",
    "dual-use",
    "Dangerous for the environment",
    "Warning",
]


def normalize_pt_text(text: str) -> str:
    for src, dst in PT_PATCHES.items():
        text = text.replace(src, dst)
    return text


def fold_text(text: str) -> str:
    return "".join(
        ch for ch in unicodedata.normalize("NFKD", text) if not unicodedata.combining(ch)
    ).lower()


def transform_text(text: str, product_key: str, language: str, source_lang: str) -> str:
    if not text:
        return text
    protected = protect_text(text, product_key)
    translated = protected
    if language == "Portuguese" and source_lang == "en":
        translated = translate_google(protected, "en", "pt-PT")
    elif language == "Portuguese" and any(token in protected for token in PT_TRANSLATE_IF_CONTAINS):
        translated = translate_google(protected, "en", "pt-PT")
    translated = unprotect_text(translated, product_key, language)
    translated = translated.replace("Product code", "").strip()
    translated = translated.replace("FCF", "AROMA + WAX")
    translated = re.sub(r"FRENCH COLOR.*?(?:GmbH|CO\.?)", "AROMA + WAX", translated, flags=re.I)
    translated = translated.replace("French Color & Fragrance Co.", "AROMA + WAX")
    if language == "Portuguese":
        translated = normalize_pt_text(translated)
    translated = translated.replace("  ", " ").strip()
    return translated


def transform_rows(rows: list[list[str]], product_key: str, language: str, source_lang: str) -> list[list[str]]:
    out = []
    for row in rows:
        new_row = [
            transform_table_cell(cell, product_key, language, source_lang)
            for cell in row
        ]
        out.append(new_row)
    return out


def looks_technical_cell(text: str) -> bool:
    if not text.strip():
        return False
    technical_tokens = [
        "CAS-No",
        "EC-No",
        "REACH",
        "EC Index-No",
        "Número de índice",
        "N.º CAS",
        "N.º CE",
        "N.º REACH",
        "UN 3082",
        "N.O.S.",
    ]
    if any(token in text for token in technical_tokens):
        return True
    if re.search(r"\bH\d{3}\b", text) and any(token in text for token in ["Skin ", "Eye ", "Acute ", "Aquatic ", "Flam.", "Asp."]):
        return True
    return bool(re.search(r"\b\d{3,}\b", text) and any(token in text for token in ["CAS", "EC", "REACH", "UN"]))


def transform_table_cell(text: str, product_key: str, language: str, source_lang: str) -> str:
    if language == "Portuguese" and source_lang == "en" and looks_technical_cell(text):
        patched = unprotect_text(protect_text(text, product_key), product_key, language)
        return normalize_pt_text(patched)
    return transform_text(text, product_key, language, source_lang)


def model_for(product_key: str, language: str) -> DocumentModel:
    product = PRODUCTS[product_key]
    source_file = SOURCE_DIR / product["source_langs"][language]
    source_lang = "en" if language == "Portuguese" and product_key == "damask" else LANGUAGES[language]["source_lang"]
    if language == "Portuguese" and product_key == "damask":
        source_lang = "en"
    with pdfplumber.open(source_file) as pdf:
        header_sds_title, header_regulation, header_meta = extract_header_info(pdf.pages[0])
        page_data = [extract_line_items(page, index + 1) for index, page in enumerate(pdf.pages)]
    blocks, hazard_codes = build_blocks(page_data)
    header_sds_title = transform_text(header_sds_title, product_key, language, source_lang)
    header_regulation = transform_text(header_regulation, product_key, language, source_lang)
    header_meta = transform_text(header_meta, product_key, language, source_lang)
    transformed_blocks: list[Block] = []
    for block in blocks:
        if block.kind in {"section", "subsection", "minor_heading", "paragraph"}:
            transformed_blocks.append(
                Block(
                    kind=block.kind,
                    text=transform_text(block.text or "", product_key, language, source_lang),
                    subsection=block.subsection,
                    source_blue=block.source_blue,
                    bold=block.bold,
                )
            )
        elif block.kind == "kv":
            rows = transform_rows(block.rows or [], product_key, language, source_lang)
            code_labels = {
                "product code",
                "codigo do produto",
                "code produit",
                "produktcode",
                "codigo de producto",
                "codigo del producto",
            }
            rows = [
                row
                for row in rows
                if fold_text(row[0].strip()) not in code_labels
            ]
            rows = [row for row in rows if not (not row[0].strip() and row[1].strip() == PRODUCTS[product_key]["new_code"])]
            transformed_blocks.append(Block(kind="kv", rows=rows, subsection=block.subsection))
        elif block.kind == "table":
            transformed_blocks.append(
                Block(
                    kind="table",
                    rows=transform_rows(block.rows or [], product_key, language, source_lang),
                    col_widths=block.col_widths,
                    subsection=block.subsection,
                )
            )
    return DocumentModel(
        product_key=product_key,
        language=language,
        header_sds_title=header_sds_title,
        header_regulation=header_regulation,
        header_meta=header_meta,
        footer_language=LANGUAGES[language]["footer"],
        blocks=transformed_blocks,
        hazard_codes=hazard_codes,
    )


def styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "normal": ParagraphStyle(
            "sdk_normal",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            spaceAfter=3,
            textColor=BLACK,
        ),
        "bold": ParagraphStyle(
            "sdk_bold",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            spaceAfter=3,
            textColor=BLACK,
        ),
        "section": ParagraphStyle(
            "sdk_section",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=13,
            textColor=colors.white,
        ),
        "subsection": ParagraphStyle(
            "sdk_subsection",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=GREEN,
            spaceAfter=4,
        ),
        "minor_green": ParagraphStyle(
            "sdk_minor_green",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=GREEN,
            spaceAfter=3,
        ),
        "cell": ParagraphStyle(
            "sdk_cell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=BLACK,
        ),
        "cell_green": ParagraphStyle(
            "sdk_cell_green",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=GREEN,
        ),
        "cell_center": ParagraphStyle(
            "sdk_cell_center",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            alignment=TA_CENTER,
            textColor=BLACK,
        ),
    }


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, header: dict, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self.header = header

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_fixed_parts(total_pages)
            super().showPage()
        super().save()

    def draw_fixed_parts(self, total_pages: int):
        width, height = A4
        self.saveState()
        self.setFillColor(BLACK)
        self.setFont("Helvetica-Bold", 22)
        self.drawString(35 * mm, height - 22 * mm, "AROMA+WAX")
        text_obj = self.beginText(35 * mm, height - 29 * mm)
        text_obj.setFont("Helvetica", 11)
        text_obj.setCharSpace(1.8)
        text_obj.textLine(self.header["tagline"])
        self.drawText(text_obj)

        title_x = 95 * mm
        title = self.header["title"]
        title_font = 16 if len(title) <= 22 else 14.5 if len(title) <= 28 else 13.5
        self.setFont("Helvetica-Bold", title_font)
        self.drawString(title_x, height - 16 * mm, self.header["title"])
        self.setFont("Helvetica-Bold", 9.5)
        self.drawString(title_x, height - 22.5 * mm, self.header["fragrance"])
        self.setFont("Helvetica", 17)
        self.drawString(title_x, height - 29 * mm, self.header["sds_title"])

        header_style = ParagraphStyle(
            "header_small_inline",
            fontName="Helvetica",
            fontSize=7.1,
            leading=7.8,
            textColor=BLACK,
        )
        header_width = width - title_x - 35 * mm
        reg_para = paragraph(self.header["regulation"], header_style)
        reg_w, reg_h = reg_para.wrap(header_width, 18 * mm)
        reg_para.drawOn(self, title_x, height - 35 * mm - reg_h)
        meta_para = paragraph(self.header["meta"], header_style)
        meta_w, meta_h = meta_para.wrap(header_width, 18 * mm)
        meta_para.drawOn(self, title_x, height - 35 * mm - reg_h - meta_h - 1)

        self.setStrokeColor(BLACK)
        self.setLineWidth(0.4)
        self.line(35 * mm, 14 * mm, width - 35 * mm, 14 * mm)
        self.setFont("Helvetica", 8.5)
        self.drawString(35 * mm, 9 * mm, self.header["footer_left"])
        self.drawCentredString(width / 2, 9 * mm, self.header["footer_lang"])
        self.drawRightString(width - 35 * mm, 9 * mm, f"{self._pageNumber}/{total_pages}")
        self.restoreState()


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    safe = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    safe = safe.replace("\n", "<br/>")
    return Paragraph(safe, style)


def section_bar(text: str, st: dict[str, ParagraphStyle], width: float):
    tbl = Table([[paragraph(text, st["section"])]], colWidths=[width])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), GREEN),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return tbl


def hazard_icon_table(doc: DocumentModel, assets: dict[str, Path], st: dict[str, ParagraphStyle]):
    icons = []
    if any(code in doc.hazard_codes for code in ["H302", "H315", "H317", "H319"]):
        icons.append(("GHS07", assets["ghs07"]))
    if any(code in doc.hazard_codes for code in ["H400", "H410", "H411"]):
        icons.append(("GHS09", assets["ghs09"]))
    if not icons:
        return paragraph("-", st["cell"])
    cells = []
    for label, path in icons:
        img = Image(str(path), width=28 * mm, height=28 * mm)
        cells.append(
            Table(
                [[img], [paragraph(label, st["cell_center"])]],
                colWidths=[30 * mm],
            )
        )
    icon_tbl = Table([cells], colWidths=[32 * mm] * len(cells))
    icon_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return icon_tbl


def kv_table(block: Block, doc: DocumentModel, doc_width: float, st: dict[str, ParagraphStyle], assets: dict[str, Path]):
    rows = block.rows or []
    if not rows:
        return None
    boxed = block.subsection in BOXED_SUBSECTIONS or (
        block.subsection == "1.2"
        and rows
        and rows[0][0].strip().lower()
        in {
            "main use category",
            "categorie de l'usage principal",
            "hauptverwendungskategorie",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoria de uso principal",
            "categoría de uso principal",
        }
    )
    data = []
    if boxed:
        for left, right in rows:
            data.append([paragraph(left, st["cell"]), paragraph(right, st["cell"])])
        table = Table(data, colWidths=[doc_width * 0.51, doc_width * 0.49])
        table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.4, BLACK),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        return table

    for left, right in rows:
        if "hazard pictogram" in left.lower() or "pictogramas de perigo" in left.lower():
            value = hazard_icon_table(doc, assets, st)
        else:
            value = paragraph(right, st["cell"])
        data.append([paragraph(left, st["cell"]), paragraph(":", st["cell_center"]), value])
    table = Table(data, colWidths=[doc_width * 0.36, doc_width * 0.03, doc_width * 0.61])
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    return table


def build_table(block: Block, doc_width: float, st: dict[str, ParagraphStyle], assets: dict[str, Path]):
    rows = [row[:] for row in (block.rows or [])]
    if not rows:
        return None
    widths = block.col_widths or [1] * len(rows[0])
    scale = doc_width / sum(widths)
    col_widths = [w * scale for w in widths]

    data = []
    repeat_rows = 0
    spans: list[tuple[int, int]] = []
    row_styles: dict[int, str] = {}

    if rows and all(rows[0]):
        repeat_rows = 1

    for row_idx, row in enumerate(rows):
        nonempty = [cell for cell in row if cell]
        if len(nonempty) == 1 and row[0]:
            spans.append((row_idx, len(row) - 1))
            style = "span"
            cell_row = [paragraph(row[0], st["cell_green"])] + [""] * (len(row) - 1)
        elif row_idx == 0 and repeat_rows:
            style = "header"
            cell_row = [paragraph(cell, st["cell_green"]) for cell in row]
        elif all(not cell for cell in row):
            style = "icon"
            icon = Image(str(assets["transport"]), width=30 * mm, height=15 * mm)
            cell_row = [icon for _ in row]
        else:
            style = "body"
            centered = all(cell.strip().isdigit() or cell.strip() in {"III", "Not applicable"} for cell in row if cell)
            style_obj = st["cell_center"] if centered else st["cell"]
            cell_row = [paragraph(cell, style_obj) for cell in row]
        row_styles[row_idx] = style
        data.append(cell_row)

    table = LongTable(data, colWidths=col_widths, repeatRows=repeat_rows)
    style_cmds = [
        ("GRID", (0, 0), (-1, -1), 0.4, BLACK),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    for row_idx, style in row_styles.items():
        if style == "header":
            style_cmds.extend(
                [
                    ("BACKGROUND", (0, row_idx), (-1, row_idx), LIGHT_GREEN),
                    ("TEXTCOLOR", (0, row_idx), (-1, row_idx), GREEN),
                ]
            )
        elif style == "span":
            style_cmds.extend(
                [
                    ("TEXTCOLOR", (0, row_idx), (-1, row_idx), GREEN),
                    ("BACKGROUND", (0, row_idx), (-1, row_idx), colors.white),
                ]
            )
        elif style == "icon":
            style_cmds.append(("ALIGN", (0, row_idx), (-1, row_idx), "CENTER"))
            style_cmds.append(("VALIGN", (0, row_idx), (-1, row_idx), "MIDDLE"))
    for row_idx, last_col in spans:
        style_cmds.append(("SPAN", (0, row_idx), (last_col, row_idx)))
    table.setStyle(TableStyle(style_cmds))
    return table


def supplier_box(doc_width: float, st: dict[str, ParagraphStyle], supplier_line: str):
    text = "<br/>".join(
        [
            f"<b>{supplier_line}</b>",
            "",
            *SUPPLIER_BLOCK,
        ]
    )
    tbl = Table([[Paragraph(text, st["cell"])]], colWidths=[doc_width])
    tbl.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.4, BLACK),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return tbl


def build_story(doc: DocumentModel, doc_width: float, st: dict[str, ParagraphStyle], assets: dict[str, Path]):
    story = []
    skip_supplier_content = False
    for block in doc.blocks:
        if skip_supplier_content and block.kind not in {"section", "subsection"}:
            continue
        if block.kind in {"section", "subsection"}:
            skip_supplier_content = False

        if block.kind == "section":
            story.append(Spacer(1, 4))
            story.append(section_bar(block.text or "", st, doc_width))
            story.append(Spacer(1, 8))
        elif block.kind == "subsection":
            story.append(paragraph(block.text or "", st["subsection"]))
            story.append(Spacer(1, 2))
            if block.subsection == "1.3":
                story.append(supplier_box(doc_width, st, LANGUAGES[doc.language]["supplier_line"]))
                story.append(Spacer(1, 8))
                skip_supplier_content = True
        elif block.kind == "minor_heading":
            story.append(paragraph(block.text or "", st["minor_green"]))
        elif block.kind == "paragraph":
            style = st["bold"] if block.bold else st["normal"]
            story.append(paragraph(block.text or "", style))
        elif block.kind == "kv":
            tbl = kv_table(block, doc, doc_width, st, assets)
            if tbl is not None:
                story.append(tbl)
                story.append(Spacer(1, 8))
        elif block.kind == "table":
            tbl = build_table(block, doc_width, st, assets)
            if tbl is not None:
                story.append(tbl)
                story.append(Spacer(1, 8))
    return story


def output_filename(product_key: str, language: str) -> str:
    product = PRODUCTS[product_key]
    name = product["names"][language]
    safe_name = re.sub(r"[^A-Z0-9]+", "_", name.upper()).strip("_")
    return f"{product['new_code_fs']}_{safe_name}_{language}.pdf"


def render_document(doc_model: DocumentModel, assets: dict[str, Path]) -> Path:
    st = styles()
    product = PRODUCTS[doc_model.product_key]
    out_path = SDK_DIR / output_filename(doc_model.product_key, doc_model.language)
    def footer_left(meta: str) -> str:
        patterns = [
            r"(Revision date)\s*:\s*([0-9./-]+)",
            r"(Date de revision)\s*:\s*([0-9./-]+)",
            r"(Data da revisao)\s*:\s*([0-9./-]+)",
            r"(Fecha de revision)\s*:\s*([0-9./-]+)",
            r"(Ausgabedatum)\s*:\s*([0-9./-]+)",
            r"(Issue date)\s*:\s*([0-9./-]+)",
        ]
        meta_ascii = meta
        for pat in patterns:
            match = re.search(pat, meta_ascii, flags=re.I)
            if match:
                return f"{match.group(2)} ({match.group(1)})"
        return meta[:60]

    header = {
        "title": f"{product['names'][doc_model.language]} {product['new_code']}",
        "fragrance": LANGUAGES[doc_model.language]["fragrance"],
        "tagline": LANGUAGES[doc_model.language]["tagline"],
        "sds_title": doc_model.header_sds_title,
        "regulation": doc_model.header_regulation,
        "meta": doc_model.header_meta,
        "footer_left": footer_left(doc_model.header_meta),
        "footer_lang": doc_model.footer_language,
    }

    frame = Frame(35 * mm, 18 * mm, A4[0] - 70 * mm, A4[1] - 56 * mm - 18 * mm, leftPadding=0, bottomPadding=0, rightPadding=0, topPadding=0)
    template = PageTemplate(id="sdk", frames=[frame])
    doc = BaseDocTemplate(
        str(out_path),
        pagesize=A4,
        leftMargin=35 * mm,
        rightMargin=35 * mm,
        topMargin=42 * mm,
        bottomMargin=18 * mm,
        pageTemplates=[template],
    )
    story = build_story(doc_model, frame._width, st, assets)
    doc.build(
        story,
        canvasmaker=lambda *args, **kwargs: NumberedCanvas(*args, header=header, **kwargs),
    )
    return out_path


def copy_originals() -> None:
    original_bucket = SDK_DIR / "source" / "original_sds"
    original_bucket.mkdir(parents=True, exist_ok=True)
    for pdf in SOURCE_DIR.glob("*.pdf"):
        target = original_bucket / pdf.name
        if not target.exists():
            shutil.copy2(pdf, target)


def main() -> None:
    ensure_dirs()
    unzip_sources()
    assets = ensure_sample_assets()
    copy_originals()

    outputs = []
    for product_key in ["damask", "forest", "smoking"]:
        for language in ["English", "French", "German", "Portuguese", "Spanish"]:
            model = model_for(product_key, language)
            outputs.append(render_document(model, assets))
            save_cache()
    print("Generated:")
    for path in outputs:
        print(path.name)


if __name__ == "__main__":
    main()
