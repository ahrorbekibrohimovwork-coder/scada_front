from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence, Tuple

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.sql.schema import Column, Table

from db_operations import Base, engine
from models import *  # noqa: F401,F403 - needed to register models on Base.metadata


@dataclass
class ColumnInfo:
    name: str
    data_type: str
    nullable: bool
    default: Optional[str]


@dataclass
class TableInfo:
    name: str
    columns: Dict[str, ColumnInfo] = field(default_factory=dict)


@dataclass
class ReconcileAction:
    kind: str
    table: str
    sql: Optional[str]
    reason: str
    safe_to_apply: bool


TYPE_MAP = {
    "INTEGER": "INTEGER",
    "BIGINT": "BIGINT",
    "SMALLINT": "SMALLINT",
    "VARCHAR": "VARCHAR",
    "TEXT": "TEXT",
    "DATETIME": "TIMESTAMP",
    "DATE": "DATE",
    "BOOLEAN": "BOOLEAN",
}

DB_TYPE_NORMALIZATION = {
    "CHARACTER VARYING": "VARCHAR",
    "VARCHAR": "VARCHAR",
    "TEXT": "TEXT",
    "INTEGER": "INTEGER",
    "BIGINT": "BIGINT",
    "SMALLINT": "SMALLINT",
    "BOOLEAN": "BOOLEAN",
    "TIMESTAMP WITHOUT TIME ZONE": "TIMESTAMP",
    "TIMESTAMP WITH TIME ZONE": "TIMESTAMPTZ",
    "TIMESTAMP": "TIMESTAMP",
    "DATE": "DATE",
}

KEEP_EXTRA_TABLES = {
    "organizations",
    "object_types",
}


def normalize_type(column: Column) -> str:
    compiled = column.type.compile(dialect=engine.dialect).upper()
    for key, value in TYPE_MAP.items():
        if compiled.startswith(key):
            if key == "VARCHAR":
                length = getattr(column.type, "length", None)
                return f"VARCHAR({length})" if length else "VARCHAR"
            return value
    return compiled


def normalize_db_type(db_type: str) -> str:
    return DB_TYPE_NORMALIZATION.get((db_type or "").upper(), (db_type or "").upper())


def load_db_schema(db_engine: Engine) -> Dict[str, TableInfo]:
    db_schema: Dict[str, TableInfo] = {}
    with db_engine.connect() as conn:
        tables = conn.execute(
            text(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
                """
            )
        ).fetchall()

        for (table_name,) in tables:
            cols = conn.execute(
                text(
                    """
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = :table_name
                    ORDER BY ordinal_position
                    """
                ),
                {"table_name": table_name},
            ).fetchall()
            db_schema[table_name] = TableInfo(
                name=table_name,
                columns={
                    col_name: ColumnInfo(
                        name=col_name,
                        data_type=normalize_db_type(data_type),
                        nullable=is_nullable == "YES",
                        default=column_default,
                    )
                    for col_name, data_type, is_nullable, column_default in cols
                },
            )
    return db_schema


def build_expected_schema() -> Dict[str, Table]:
    return {table.name: table for table in Base.metadata.sorted_tables}


def render_create_table(table: Table) -> str:
    cols: List[str] = []
    for column in table.columns:
        pieces = [column.name, normalize_type(column)]
        if column.primary_key:
            pieces.append("PRIMARY KEY")
        if not column.nullable and not column.primary_key:
            pieces.append("NOT NULL")
        cols.append(" ".join(pieces))

    fk_parts: List[str] = []
    for column in table.columns:
        for foreign_key in column.foreign_keys:
            fk_parts.append(
                f"FOREIGN KEY ({column.name}) REFERENCES {foreign_key.column.table.name} ({foreign_key.column.name})"
            )

    all_parts = cols + fk_parts
    joined = ",\n    ".join(all_parts)
    return f'CREATE TABLE "{table.name}" (\n    {joined}\n);'


def build_reconcile_plan(db_schema: Dict[str, TableInfo], expected_schema: Dict[str, Table]) -> List[ReconcileAction]:
    actions: List[ReconcileAction] = []

    for table_name, table in expected_schema.items():
        if table_name not in db_schema:
            actions.append(
                ReconcileAction(
                    kind="create_table",
                    table=table_name,
                    sql=render_create_table(table),
                    reason="Table exists in SQLAlchemy models but is missing in the database.",
                    safe_to_apply=True,
                )
            )
            continue

        actual_table = db_schema[table_name]
        for column in table.columns:
            if column.name not in actual_table.columns:
                nullable_sql = "" if column.nullable or column.primary_key else " NULL"
                sql = (
                    f'ALTER TABLE "{table_name}" '
                    f'ADD COLUMN "{column.name}" {normalize_type(column)}{nullable_sql};'
                )
                safe = column.nullable or bool(column.default is not None)
                actions.append(
                    ReconcileAction(
                        kind="add_column",
                        table=table_name,
                        sql=sql,
                        reason=(
                            "Column exists in SQLAlchemy models but is missing in the database."
                            + (" Added as nullable because a strict NOT NULL add may fail on existing rows." if not safe else "")
                        ),
                        safe_to_apply=True,
                    )
                )

        for actual_column in actual_table.columns.values():
            if actual_column.name not in table.columns:
                actions.append(
                    ReconcileAction(
                        kind="extra_column",
                        table=table_name,
                        sql=f'ALTER TABLE "{table_name}" DROP COLUMN "{actual_column.name}";',
                        reason="Column exists in the database but is not described by SQLAlchemy models.",
                        safe_to_apply=False,
                    )
                )

        expected_column_names = {column.name for column in table.columns}
        for column in table.columns:
            actual = actual_table.columns.get(column.name)
            if not actual:
                continue
            expected_type = normalize_type(column)
            expected_base = expected_type.split("(")[0]
            actual_base = actual.data_type.split("(")[0]
            if actual_base != expected_base:
                actions.append(
                    ReconcileAction(
                        kind="type_mismatch",
                        table=table_name,
                        sql=None,
                        reason=(
                            f'Column "{column.name}" type mismatch: DB has {actual.data_type}, '
                            f'model expects {expected_type}.'
                        ),
                        safe_to_apply=False,
                    )
                )
            if column.nullable != actual.nullable:
                actions.append(
                    ReconcileAction(
                        kind="nullability_mismatch",
                        table=table_name,
                        sql=None,
                        reason=(
                            f'Column "{column.name}" nullability mismatch: DB nullable={actual.nullable}, '
                            f'model nullable={column.nullable}.'
                        ),
                        safe_to_apply=False,
                    )
                )

    for table_name in db_schema:
        if table_name not in expected_schema:
            if table_name in KEEP_EXTRA_TABLES:
                continue
            actions.append(
                ReconcileAction(
                    kind="extra_table",
                    table=table_name,
                    sql=f'DROP TABLE "{table_name}";',
                    reason="Table exists in the database but is not described by SQLAlchemy models.",
                    safe_to_apply=False,
                )
            )

    return actions


def print_schema_summary(db_schema: Dict[str, TableInfo]) -> None:
    print("=== Current Database Schema ===")
    for table_name, table in db_schema.items():
        print(f"\n[{table_name}]")
        for column in table.columns.values():
            nullable = "NULL" if column.nullable else "NOT NULL"
            default = f" DEFAULT {column.default}" if column.default else ""
            print(f"  - {column.name}: {column.data_type} {nullable}{default}")


def print_plan(actions: Sequence[ReconcileAction]) -> None:
    print("\n=== Reconciliation Plan ===")
    if not actions:
        print("Database schema already matches the SQLAlchemy models closely enough for this tool.")
        return

    for index, action in enumerate(actions, start=1):
        safety = "SAFE" if action.safe_to_apply else "MANUAL"
        print(f"{index}. [{safety}] {action.kind} on {action.table}")
        print(f"   Reason: {action.reason}")
        if action.sql:
            print(f"   SQL: {action.sql}")


def apply_actions(db_engine: Engine, actions: Sequence[ReconcileAction], include_destructive: bool) -> Tuple[int, int]:
    applied = 0
    skipped = 0

    with db_engine.begin() as conn:
        for action in actions:
            if not action.sql:
                skipped += 1
                continue

            destructive = action.kind in {"extra_column", "extra_table"}
            if destructive and not include_destructive:
                skipped += 1
                continue

            if not action.safe_to_apply and not destructive:
                skipped += 1
                continue

            conn.execute(text(action.sql))
            applied += 1

    return applied, skipped


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Inspect the current PostgreSQL schema and reconcile it with tb_backend SQLAlchemy models."
    )
    parser.add_argument(
        "--apply-additive",
        action="store_true",
        help="Apply only safe additive changes such as creating missing tables and adding missing columns.",
    )
    parser.add_argument(
        "--drop-extra",
        action="store_true",
        help="Also apply destructive DROP actions for extra tables/columns that are not present in models.",
    )
    args = parser.parse_args()

    db_schema = load_db_schema(engine)
    expected_schema = build_expected_schema()
    actions = build_reconcile_plan(db_schema, expected_schema)

    print_schema_summary(db_schema)
    print_plan(actions)

    if not args.apply_additive:
        print("\nNo changes were applied. Re-run with --apply-additive to apply safe additive changes.")
        print("Use --drop-extra only if you are absolutely sure extra tables/columns should be removed.")
        return

    applied, skipped = apply_actions(engine, actions, include_destructive=args.drop_extra)
    print(f"\nApplied actions: {applied}")
    print(f"Skipped actions: {skipped}")


if __name__ == "__main__":
    main()
