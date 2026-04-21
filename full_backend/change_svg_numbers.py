import random
import re
import os
from typing import Any, Dict

from bs4 import BeautifulSoup
from fastapi import APIRouter, Request
from fastapi.responses import Response

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_default_svg = os.path.join(BASE_DIR, '..', 'svg_files', 'good_example.svg')
SVG_PATH = os.getenv('SVG_PATH', _default_svg)

# ── Signal → SVG placeholder number ─────────────────────────────────────────
SIGNAL_TO_SVG: Dict[str, int] = {
    # PLC-1 (Агрегат 1)
    "bozsu.plc1.ai.active_power":   62,
    "bozsu.plc1.ai.cosphi":         57,
    "bozsu.plc1.ai.current_a":      50,
    "bozsu.plc1.ai.current_b":      51,
    "bozsu.plc1.ai.current_c":      52,
    "bozsu.plc1.ai.exc_current":    59,
    "bozsu.plc1.ai.exc_voltage":    58,
    "bozsu.plc1.ai.frequency":      53,
    "bozsu.plc1.ai.ga1_open":       61,
    "bozsu.plc1.ai.igv1_position":  60,
    "bozsu.plc1.ai.reactive_power": 63,
    "bozsu.plc1.ai.uab":            54,
    "bozsu.plc1.ai.ubc":            55,
    "bozsu.plc1.ai.uca":            56,
    # PLC-2 (Агрегат 2)
    "bozsu.plc2.ai.active_power":   162,
    "bozsu.plc2.ai.cosphi":         157,
    "bozsu.plc2.ai.current_a":      150,
    "bozsu.plc2.ai.current_b":      151,
    "bozsu.plc2.ai.current_c":      152,
    "bozsu.plc2.ai.exc_current":    159,
    "bozsu.plc2.ai.exc_voltage":    158,
    "bozsu.plc2.ai.frequency":      153,
    "bozsu.plc2.ai.ga1_open":       161,
    "bozsu.plc2.ai.igv1_position":  160,
    "bozsu.plc2.ai.reactive_power": 163,
    "bozsu.plc2.ai.uab":            154,
    "bozsu.plc2.ai.ubc":            155,
    "bozsu.plc2.ai.uca":            156,
    # TSN (Трансформатор собственных нужд)
    "bozsu.tsn.ai.active_power":    203,
    "bozsu.tsn.ai.current_a":       202,
    "bozsu.tsn.ai.current_b":       201,
    "bozsu.tsn.ai.current_c":       200,
    # RLT-1
    "bozsu.rlt1.ai.frequency":          21,
    "bozsu.rlt1.ai.frequency_10kv":     17,
    "bozsu.rlt1.ai.uab":                14,
    "bozsu.rlt1.ai.ubc":                15,
    "bozsu.rlt1.ai.uca":                16,
    "bozsu.rlt1.ai.voltage_10kv_ab":    18,
    "bozsu.rlt1.ai.voltage_10kv_bc":    19,
    "bozsu.rlt1.ai.voltage_10kv_ca":    20,
    # RLT-2
    "bozsu.rlt2.ai.frequency":          121,
    "bozsu.rlt2.ai.frequency_10kv":     117,
    "bozsu.rlt2.ai.uab":                114,
    "bozsu.rlt2.ai.ubc":                115,
    "bozsu.rlt2.ai.uca":                116,
    "bozsu.rlt2.ai.voltage_10kv_ab":    118,
    "bozsu.rlt2.ai.voltage_10kv_bc":    119,
    "bozsu.rlt2.ai.voltage_10kv_ca":    120,
    # RHT-1 (Трансформатор 35 кВ)
    "bozsu.rht1.ai.active_power":        9,
    "bozsu.rht1.ai.cosphi":             11,
    "bozsu.rht1.ai.current_a":           5,
    "bozsu.rht1.ai.current_b":           6,
    "bozsu.rht1.ai.current_c":           7,
    "bozsu.rht1.ai.frequency":           4,
    "bozsu.rht1.ai.oil_temperature":    12,
    "bozsu.rht1.ai.reactive_power":     10,
    "bozsu.rht1.ai.uab":                 1,
    "bozsu.rht1.ai.ubc":                 2,
    "bozsu.rht1.ai.uca":                 3,
    "bozsu.rht1.ai.voltage_35kv":        8,
    "bozsu.rht1.ai.winding_temperature": 13,
    # RHT-2
    "bozsu.rht2.ai.active_power":       109,
    "bozsu.rht2.ai.cosphi":             111,
    "bozsu.rht2.ai.current_a":          105,
    "bozsu.rht2.ai.current_b":          106,
    "bozsu.rht2.ai.current_c":          107,
    "bozsu.rht2.ai.frequency":          104,
    "bozsu.rht2.ai.oil_temperature":    112,
    "bozsu.rht2.ai.reactive_power":     110,
    "bozsu.rht2.ai.uab":                101,
    "bozsu.rht2.ai.ubc":                102,
    "bozsu.rht2.ai.uca":                103,
    "bozsu.rht2.ai.voltage_35kv":       108,
    "bozsu.rht2.ai.winding_temperature": 113,
    # TSN-1
    "bozsu.tsn1.ai.active_power":  80,
    "bozsu.tsn1.ai.frequency":     84,
    "bozsu.tsn1.ai.uab":           81,
    "bozsu.tsn1.ai.ubc":           82,
    "bozsu.tsn1.ai.uca":           83,
    # TSN-2
    "bozsu.tsn2.ai.active_power":  180,
    "bozsu.tsn2.ai.frequency":     184,
    "bozsu.tsn2.ai.uab":           181,
    "bozsu.tsn2.ai.ubc":           182,
    "bozsu.tsn2.ai.uca":           183,
}

# Reverse lookup: SVG placeholder number → live value string
_live: Dict[int, str] = {}
# Last raw payload received (for debugging mismatches)
_last_raw: Dict[str, Any] = {}
_unmatched: list = []

_PERSIST_FILE = os.path.join(BASE_DIR, '_live_cache.json')

def _load_live() -> None:
    try:
        import json
        with open(_PERSIST_FILE, 'r') as f:
            data = json.load(f)
        _live.update({int(k): v for k, v in data.items()})
        print(f"[debug] Loaded {len(_live)} live values from cache")
    except Exception:
        pass

def _save_live() -> None:
    try:
        import json
        with open(_PERSIST_FILE, 'w') as f:
            json.dump({str(k): v for k, v in _live.items()}, f)
    except Exception:
        pass

_load_live()


def _raw(value: Any) -> str:
    """Store-safe: plain numeric string, no formatting."""
    try:
        return str(float(value))
    except Exception:
        return str(value)


def _fmt(value: Any) -> str:
    """Display-safe: thousands-separated with 2 decimals."""
    try:
        f = float(str(value).replace('\u00a0', '').replace(' ', ''))
        return f"{f:,.2f}".replace(",", "\u00a0")
    except Exception:
        return str(value)


def _generate_svg(use_live: bool) -> str:
    with open(SVG_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    def replacer(m: re.Match) -> str:
        full = m.group(0)
        inner = m.group(1).strip()
        clean = inner.rstrip('.')
        try:
            num = int(float(clean))
        except ValueError:
            return full
        # Real data for mapped signals
        if use_live and num in _live:
            return f">{_fmt(_live[num])}<"
        # Random fallback for unmapped positions
        if num < 2:
            return f">{random.uniform(0.1, 0.99):.2f}<"
        val = str(random.randint(100, 999))
        if inner.endswith('.'):
            val += '.'
        return f">{val}<"

    content = re.sub(r'>(\s*\d+\.?\s*)<', replacer, content)
    content = re.sub(r'<\?xml[^>]+\?>', '', content).strip()
    return content


# ── Routes ───────────────────────────────────────────────────────────────────

def _kaskad_values() -> Dict[int, str]:
    """Build placeholder→value map for kaskad.svg."""
    plc1_active   = float(_live.get(62,  0))   # bozsu.plc1.ai.active_power
    plc2_active   = float(_live.get(162, 0))   # bozsu.plc2.ai.active_power
    plc1_reactive = float(_live.get(63,  0))   # bozsu.plc1.ai.reactive_power
    return {
        111: _fmt(plc1_active + plc2_active),
        112: _fmt(plc1_active),
        113: _fmt(plc1_reactive),
        114: "470",
        115: "470",
    }


def _generate_kaskad_svg() -> str:
    kaskad_path = os.path.join(BASE_DIR, '..', 'svg_files', 'kaskad.svg')
    with open(kaskad_path, "r", encoding="utf-8") as f:
        content = f.read()

    values = _kaskad_values()

    # Simple regex replacement — avoids lxml namespace mangling
    def replacer(m: re.Match) -> str:
        full = m.group(0)          # entire >111< or >111.< match
        inner = m.group(1).strip() # just the number text
        clean = inner.rstrip('.')
        try:
            num = int(float(clean))
        except ValueError:
            return full
        if num in values:
            return f">{values[num]}<"
        return full

    # Match >NUMBER< or >NUMBER.< inside tspan/text tags
    content = re.sub(r'>(\s*\d+\.?\s*)<', replacer, content)

    # Strip XML declaration so SVG can be embedded inline
    content = re.sub(r'<\?xml[^>]+\?>', '', content).strip()
    # Force SVG to fill its container: replace or inject width/height/style
    content = re.sub(r'(<svg\b[^>]*?)\bwidth="[^"]*"', r'\1width="100%"', content, flags=re.DOTALL)
    content = re.sub(r'(<svg\b[^>]*?)\bheight="[^"]*"', r'\1height="100%"', content, flags=re.DOTALL)
    # If no width/height found, inject style
    if 'width="100%"' not in content:
        content = re.sub(r'<svg\b', '<svg width="100%" height="100%"', content, count=1)
    return content


@router.get("/schema/svg")
def get_schema_svg():
    svg_content = _generate_svg(use_live=bool(_live))
    return Response(content=svg_content, media_type="image/svg+xml")


@router.get("/schema/kaskad")
def get_kaskad_svg():
    svg_content = _generate_kaskad_svg()
    return Response(content=svg_content, media_type="image/svg+xml")


@router.get("/schema/bozsuv")
def get_bozsuv_svg():
    bozsuv_path = os.path.join(BASE_DIR, '..', 'svg_files', 'bozsuv.svg')
    with open(bozsuv_path, "r", encoding="utf-8") as f:
        content = f.read()

    use_live = bool(_live)

    def replacer(m: re.Match) -> str:
        full = m.group(0)
        inner = m.group(1).strip()
        clean = inner.rstrip('.')
        try:
            num = int(float(clean))
        except ValueError:
            return full
        if use_live and num in _live:
            return f">{_fmt(_live[num])}<"
        if num < 2:
            return f">{random.uniform(0.1, 0.99):.2f}<"
        val = str(random.randint(100, 999))
        if inner.endswith('.'):
            val += '.'
        return f">{val}<"

    content = re.sub(r'>(\s*\d+\.?\s*)<', replacer, content)
    content = re.sub(r'<\?xml[^>]+\?>', '', content).strip()
    content = re.sub(r'(<svg\b[^>]*?)\bwidth="[^"]*"', r'\1width="100%"', content, flags=re.DOTALL)
    content = re.sub(r'(<svg\b[^>]*?)\bheight="[^"]*"', r'\1height="100%"', content, flags=re.DOTALL)
    if 'width="100%"' not in content:
        content = re.sub(r'<svg\b', '<svg width="100%" height="100%"', content, count=1)
    return Response(content=content, media_type="image/svg+xml")


@router.get("/debug/values")
def get_live_values():
    """Return named live values for frontend metric cards."""
    svg_to_signal = {v: k for k, v in SIGNAL_TO_SVG.items()}
    return {
        svg_to_signal.get(num, str(num)): val
        for num, val in _live.items()
    }


@router.post("/debug")
async def post_debug(request: Request):
    """Receive live signal values from PLC/SCADA and update SVG placeholders.

    Body: flat JSON  {"bozsu.plc1.ai.active_power": 145.6, ...}
    """
    payload: Dict[str, Any] = await request.json()
    # Support both flat {"signal": value} and nested {"tags": {"signal": value}}
    signals: Dict[str, Any] = payload.get("tags", payload)
    _last_raw.clear()
    _last_raw.update(signals)
    _unmatched.clear()

    updated = []
    for signal, value in signals.items():
        svg_num = SIGNAL_TO_SVG.get(signal)
        if svg_num is not None:
            _live[svg_num] = _raw(value)
            updated.append(signal)
        else:
            _unmatched.append(signal)

    _save_live()
    print(f"[debug] received={len(payload)}, mapped={len(updated)}, unmatched={len(_unmatched)}")
    if _unmatched:
        print(f"[debug] unmatched signals: {_unmatched[:10]}")

    return {
        "received": len(payload),
        "mapped": len(updated),
        "unmatched": len(_unmatched),
        "updated_signals": updated,
        "unmatched_signals": _unmatched[:20],
        "total_live": len(_live),
    }


@router.get("/debug")
def get_debug():
    """Return current live values, last raw payload, and unmatched signals."""
    svg_to_signal = {v: k for k, v in SIGNAL_TO_SVG.items()}
    live_named = {svg_to_signal.get(num, str(num)): val for num, val in _live.items()}
    return {
        "live_count": len(_live),
        "live_values": live_named,
        "kaskad_preview": {
            "111_total_active": _fmt(float(_live.get(62, 0)) + float(_live.get(162, 0))),
            "112_plc1_active":  _live.get(62,  "0"),
            "113_plc1_reactive": _live.get(63, "0"),
        },
        "last_raw_payload_keys": list(_last_raw.keys()),
        "unmatched_signals": _unmatched,
    }


@router.delete("/debug")
def clear_debug():
    """Clear all live values (revert SVG to random mode)."""
    _live.clear()
    return {"status": "cleared"}
