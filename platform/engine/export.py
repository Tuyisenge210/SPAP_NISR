"""Publication-ready Excel export (OpenPyXL).

Each chapter becomes its own worksheet: a title block, the NISR-style header
row, the produced table bodies with their estimation basis, and a provenance
footer naming the dataset, year, weights and producing function.
"""

from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

HEADER_FILL = PatternFill("solid", fgColor="123B4F")
TITLE_FONT = Font(bold=True, size=14, color="0B2430")
SUBTITLE_FONT = Font(bold=True, size=11, color="123B4F")
HEADER_FONT = Font(bold=True, size=10, color="FFFFFF")
BODY_FONT = Font(size=10, color="10232B")
NOTE_FONT = Font(italic=True, size=9, color="5B7180")
THIN = Side(style="thin", color="B9CBD4")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def _write_table(sheet, start_row: int, table: dict) -> int:
    row = start_row
    sheet.cell(row=row, column=1, value=f"Table {table['id']}. {table['title']}").font = SUBTITLE_FONT
    row += 1

    columns = table.get("columns") or []
    if not columns:
        sheet.cell(row=row, column=1, value="Producer not implemented for this table.").font = NOTE_FONT
        return row + 2

    header_row = row
    sheet.cell(row=header_row, column=1, value="Category")
    for index, column in enumerate(columns, start=2):
        sheet.cell(row=header_row, column=index, value=column)
    for index in range(1, len(columns) + 2):
        cell = sheet.cell(row=header_row, column=index)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        cell.border = BORDER
    sheet.row_dimensions[header_row].height = 30
    row += 1

    for table_row in table.get("rows", []):
        sheet.cell(row=row, column=1, value=table_row["label"]).font = BODY_FONT
        sheet.cell(row=row, column=1).border = BORDER
        for index, cell in enumerate(table_row.get("cells", []), start=2):
            target = sheet.cell(row=row, column=index)
            value = cell.get("value")
            if isinstance(value, (int, float)):
                target.value = value
                target.number_format = "#,##0.0" if table.get("unit") == "percent" else "#,##0"
            else:
                target.value = cell.get("display", "—")
            target.font = BODY_FONT
            target.border = BORDER
            target.alignment = Alignment(horizontal="right")
        row += 1

    for index in range(1, len(columns) + 2):
        letter = get_column_letter(index)
        longest = max(
            [len(str(sheet.cell(row=r, column=index).value or "")) for r in range(header_row, row)] or [12]
        )
        sheet.column_dimensions[letter].width = min(max(14, longest + 3), 46)

    if table.get("notes"):
        sheet.cell(row=row, column=1, value=table["notes"]).font = NOTE_FONT
        row += 1
    return row + 2


def build_workbook(run: dict, scope: str) -> BytesIO:
    """Build an .xlsx for one chapter (scope=chapter id) or the whole run."""
    workbook = Workbook()
    workbook.remove(workbook.active)

    tables = run.get("tables", [])
    if scope != "all":
        tables = [t for t in tables if str(t.get("chapter")) == str(scope)]

    chapters: dict[int, list[dict]] = {}
    for table in tables:
        chapters.setdefault(int(table.get("chapter", 0)), []).append(table)

    if not chapters:
        sheet = workbook.create_sheet("Empty")
        sheet["A1"] = "No produced tables for this scope."
        stream = BytesIO()
        workbook.save(stream)
        stream.seek(0)
        return stream

    for chapter_id, chapter_tables in sorted(chapters.items()):
        sheet = workbook.create_sheet(f"Chapter {chapter_id}")
        sheet["A1"] = "SPAP — Statistical Production and Analytics Platform".upper()
        sheet["A1"].font = TITLE_FONT
        sheet["A2"] = f"Rwanda Labour Force Survey {run.get('year')} — Chapter {chapter_id}"
        sheet["A2"].font = Font(size=11, color="123B4F")
        sheet["A3"] = f"Dataset: {run.get('dataset_label') or run.get('dataset')}  |  Weighted estimates  |  Population 16+"
        sheet["A3"].font = NOTE_FONT
        row = 5
        for table in sorted(chapter_tables, key=lambda t: str(t.get("id"))):
            row = _write_table(sheet, row, table)

        row += 1
        sheet.cell(
            row,
            column=1,
            value=(
                f"Produced by SPAP run {run.get('id')} on "
                f"{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}. "
                "Every figure is weighted by the survey sampling weight; see the "
                "traceability view for indicator definitions and producing functions."
            ),
        ).font = NOTE_FONT
        if run.get("synthetic"):
            sheet.cell(
                row + 1,
                column=1,
                value=(
                    "CALIBRATION SAMPLE — produced from synthetic data for interface "
                    "development. Not official statistics."
                ),
            ).font = Font(italic=True, bold=True, size=9, color="A4441A")

    stream = BytesIO()
    workbook.save(stream)
    stream.seek(0)
    return stream
