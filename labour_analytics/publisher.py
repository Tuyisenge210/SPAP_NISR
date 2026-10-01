import os
from typing import Union
import pandas as pd
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, NamedStyle
)
from openpyxl.utils import get_column_letter
from .config import Config


_DATE_GROUP_FMT = "0.0"
_INTEGER_GROUP_FMT = "#,##0"


class ExcelPublisher:
    def __init__(
        self, path: str, title: str = "Rwanda Labour Force Survey Report"
    ):
        self.path = path
        self.title = title
        self._header_font = Font(bold=True, color="FFFFFF", size=11)
        self._header_fill = PatternFill(
            start_color="1F4E78", end_color="1F4E78", fill_type="solid"
        )
        self._header_align = Alignment(horizontal="center", vertical="center")
        self._border = Border(
            left=Side(style="thin"),
            right=Side(style="thin"),
            top=Side(style="thin"),
            bottom=Side(style="thin"),
        )
        self._writer = None

    def __enter__(self):
        self._writer = pd.ExcelWriter(
            self.path,
            engine="openpyxl",
            mode="w",
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._writer:
            if not self._writer.book.sheetnames:
                self._writer.book.create_sheet(title="Sheet")
            self._writer.close()

    def _write_dataframe(
        self,
        df: pd.DataFrame,
        sheet_name: str,
        title: str,
        start_row: int = 4,
        number_format: str | dict[str, str] = _DATE_GROUP_FMT,
    ):
        ws = self._writer.book.create_sheet(title=sheet_name)

        header_cols = max(df.shape[1] + 1, 2)

        ws.cell(row=1, column=1, value=self.title).font = Font(
            bold=True, size=14, color="1F4E78"
        )
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=header_cols)
        ws.cell(row=2, column=1, value=title).font = Font(bold=True, size=12)
        ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=header_cols)

        df_to_write = (
            df.reset_index()
            if isinstance(df.index, pd.MultiIndex) or not isinstance(df.index, pd.RangeIndex)
            else df
        )

        for c_idx, col_name in enumerate(df_to_write.columns, 1):
            cell = ws.cell(row=start_row, column=c_idx, value=col_name)
            cell.font = self._header_font
            cell.fill = self._header_fill
            cell.alignment = self._header_align
            cell.border = self._border

        for r_idx, row in enumerate(
            df_to_write.itertuples(index=False), start_row + 1
        ):
            for c_idx, value in enumerate(row, 1):
                cell = ws.cell(row=r_idx, column=c_idx, value=value)
                cell.border = self._border
                cell.alignment = Alignment(horizontal="center", vertical="center")
                if isinstance(value, (int, float)) and not isinstance(value, bool):
                    column_name = str(df_to_write.columns[c_idx - 1])
                    cell.number_format = (
                        number_format.get(column_name, _DATE_GROUP_FMT)
                        if isinstance(number_format, dict)
                        else number_format
                    )

        for c_idx, col_name in enumerate(df_to_write.columns, 1):
            series = df_to_write[col_name]
            data_max = 0
            if not series.empty:
                data_max = max(
                    series.astype(object).apply(lambda x: len(str(x)) if pd.notna(x) else 0)
                )
            max_len = max(data_max, len(str(col_name))) + 3
            ws.column_dimensions[get_column_letter(c_idx)].width = min(max_len, 25)

        ws.freeze_panes = f"A{start_row + 1}"
        return ws

    def write_sheet(self, df, sheet_name, title, start_row=4, number_format=_DATE_GROUP_FMT):
        self._write_dataframe(df, sheet_name, title, start_row, number_format)

    def write_long_sheet(self, df_long, sheet_name, title):
        ws = self._writer.book.create_sheet(title=sheet_name)
        ws.cell(row=1, column=1, value=self.title).font = Font(
            bold=True, size=14, color="1F4E78"
        )
        ws.merge_cells(
            start_row=1,
            start_column=1,
            end_row=1,
            end_column=max(df_long.shape[1] + 1, 2),
        )
        ws.cell(row=2, column=1, value=title).font = Font(bold=True, size=12)
        ws.merge_cells(
            start_row=2,
            start_column=1,
            end_row=2,
            end_column=max(df_long.shape[1] + 1, 2),
        )

        for c_idx, col_name in enumerate(df_long.columns, 1):
            cell = ws.cell(row=4, column=c_idx, value=col_name)
            cell.font = self._header_font
            cell.fill = self._header_fill
            cell.alignment = self._header_align
            cell.border = self._border

        for r_idx, row in enumerate(
            df_long.itertuples(index=False), 5
        ):
            for c_idx, value in enumerate(row, 1):
                cell = ws.cell(row=r_idx, column=c_idx, value=value)
                cell.border = self._border
                cell.alignment = Alignment(horizontal="center", vertical="center")

        for c_idx, col in enumerate(df_long.columns, 1):
            max_len = (
                max(
                    df_long[col].astype(str).map(len).max() if not df_long[col].empty else 0,
                    len(str(col)),
                )
                + 3
            )
            ws.column_dimensions[get_column_letter(c_idx)].width = min(max_len, 25)

        ws.freeze_panes = "A5"
