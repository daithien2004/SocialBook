#!/usr/bin/env python3
"""Sinh khung một module NestJS theo quy chuẩn (Clean Architecture + CQRS + Prisma + CASL).

Ví dụ:
    python scaffold_module.py order --out src/modules
    python scaffold_module.py purchase-order --plural purchase-orders --out src/modules
    python scaffold_module.py category --dry-run

Tên nhận kebab-case, snake_case, camelCase hoặc PascalCase (số ít). Script không ghi đè
file đã tồn tại trừ khi có --force.
"""

import argparse
import re
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
TEMPLATES = SKILL_DIR / "assets" / "templates"


def split_words(name: str) -> list[str]:
    spaced = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", name)
    words = re.sub(r"[-_\s]+", " ", spaced).strip().lower().split()
    if not words:
        raise ValueError("Tên module rỗng")
    return words


def pluralize(word: str) -> str:
    if re.search(r"(s|x|z|ch|sh)$", word):
        return word + "es"
    if re.search(r"[^aeiou]y$", word):
        return word[:-1] + "ies"
    return word + "s"


def build_tokens(words: list[str], plural_words: list[str], prisma_import: str, auth_guard_import: str) -> dict:
    pascal = "".join(w.capitalize() for w in words)
    pascal_plural = "".join(w.capitalize() for w in plural_words)
    return {
        "__Name__": pascal,
        "__name__": pascal[0].lower() + pascal[1:],
        "__kebab__": "-".join(words),
        "__UPPER__": "_".join(w.upper() for w in words),
        "__Names__": pascal_plural,
        "__names__": pascal_plural[0].lower() + pascal_plural[1:],
        "__kebabs__": "-".join(plural_words),
        "__snakes__": "_".join(plural_words),
        "__PRISMA_IMPORT__": prisma_import,
        "__AUTH_GUARD_IMPORT__": auth_guard_import,
    }


def render(text: str, tokens: dict) -> str:
    for key, value in tokens.items():
        text = text.replace(key, value)
    return text


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("name", help="Tên aggregate/module ở số ít, ví dụ: order, purchase-order")
    ap.add_argument("--plural", help="Dạng số nhiều nếu quy tắc tự động sai, ví dụ: people")
    ap.add_argument("--out", default="src/modules", help="Thư mục chứa các module (mặc định: src/modules)")
    ap.add_argument("--prisma-dir", default="prisma/schema", help="Thư mục schema Prisma (mặc định: prisma/schema)")
    ap.add_argument("--no-prisma", action="store_true", help="Không sinh file schema Prisma")
    ap.add_argument("--prisma-import", default="@/generated/prisma/client",
                    help="Đường import namespace Prisma của client generate")
    ap.add_argument("--auth-guard-import", default="@/shared/presentation/jwt-auth.guard",
                    help="Đường import JwtAuthGuard của dự án")
    ap.add_argument("--dry-run", action="store_true", help="Chỉ in danh sách file sẽ tạo")
    ap.add_argument("--force", action="store_true", help="Ghi đè file đã tồn tại")
    args = ap.parse_args()

    words = split_words(args.name)
    plural_words = split_words(args.plural) if args.plural else words[:-1] + [pluralize(words[-1])]
    tokens = build_tokens(words, plural_words, args.prisma_import, args.auth_guard_import)

    if not TEMPLATES.is_dir():
        print(f"Không thấy thư mục template: {TEMPLATES}", file=sys.stderr)
        return 2

    module_dir = Path(args.out) / tokens["__kebabs__"]
    prisma_dir = Path(args.prisma_dir)

    created, skipped = [], []
    for tpl in sorted(TEMPLATES.rglob("*.tpl")):
        rel = tpl.relative_to(TEMPLATES)
        is_prisma = rel.parts[0] == "_prisma"
        if is_prisma and args.no_prisma:
            continue
        rendered_rel = Path(render(str(rel.with_suffix("")), tokens))
        dest = prisma_dir / rendered_rel.name if is_prisma else module_dir / rendered_rel
        if dest.exists() and not args.force:
            skipped.append(dest)
            continue
        if not args.dry_run:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(render(tpl.read_text(encoding="utf-8"), tokens), encoding="utf-8")
        created.append(dest)

    verb = "Sẽ tạo" if args.dry_run else "Đã tạo"
    print(f"{verb} {len(created)} file cho module '{tokens['__kebabs__']}' ({tokens['__Name__']}):")
    for p in created:
        print(f"  + {p}")
    for p in skipped:
        print(f"  = bỏ qua (đã tồn tại, dùng --force để ghi đè): {p}")

    name = tokens["__Name__"]
    print(
        "\nViệc còn lại (script không tự làm):\n"
        f"  1. Sửa entity, mapper, read model, schema Prisma cho đúng trường nghiệp vụ của {name}.\n"
        f"  2. Đăng ký subject '{name}' vào AppAbility và gọi define{name}Abilities trong AbilityFactory.\n"
        f"  3. Thêm {tokens['__Names__']}Module vào AppModule.\n"
        "  4. Tạo migration (prisma migrate dev), đọc lại SQL trước khi commit.\n"
        "  5. Kiểm tra import alias '@/' và các file shared đã có (xem references/shared-contracts.md).\n"
        "  6. Viết test theo references/conventions.md mục Kiểm thử, rồi chạy lint."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
