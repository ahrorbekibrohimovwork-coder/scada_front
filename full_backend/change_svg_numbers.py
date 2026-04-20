import random
import re
import os
from bs4 import BeautifulSoup
from fastapi import APIRouter
from fastapi.responses import Response

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_default_svg = os.path.join(BASE_DIR, '..', 'svg_files', 'good_example.svg')
SVG_PATH = os.getenv('SVG_PATH', _default_svg)


def replace_with_random(match):
    val = match.group(0)
    clean_val = val.rstrip('.')
    try:
        num = float(clean_val)
        if num < 2:
            new_num = f"{random.uniform(0.1, 0.99):.2f}"
        else:
            new_num = str(random.randint(100, 999))
            if val.endswith('.'):
                new_num += '.'
        return new_num
    except Exception:
        return val


def generate_random_svg(path_in: str) -> str:
    with open(path_in, "r", encoding="utf-8") as f:
        content = f.read()

    soup = BeautifulSoup(content, "lxml-xml")
    elements = soup.find_all(['tspan', 'text'])
    number_pattern = re.compile(r'\d+\.\d+|\d+\.|\d+')

    for el in elements:
        if el.string:
            original_text = el.string.strip()
            if number_pattern.fullmatch(original_text):
                new_value = replace_with_random(number_pattern.search(original_text))
                el.string.replace_with(new_value)

    result = str(soup)
    # Strip XML declaration so SVG can be embedded inline in HTML
    result = re.sub(r'<\?xml[^>]+\?>', '', result).strip()
    return result


@router.get("/schema/svg")
def get_schema_svg():
    svg_content = generate_random_svg(SVG_PATH)
    return Response(content=svg_content, media_type="image/svg+xml")
