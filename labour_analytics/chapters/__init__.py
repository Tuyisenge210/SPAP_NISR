"""Chapter-oriented producers for the ordered Rwanda LFS main tables."""

from importlib import import_module

CHAPTER_MODULES = tuple(
    import_module(f".py{number:02d}", __name__)
    for number in range(1, 12)
)


def produce_chapter_tables(panel):
    tables = {}
    for chapter in CHAPTER_MODULES:
        chapter_tables = chapter.produce(panel)
        duplicates = tables.keys() & chapter_tables.keys()
        if duplicates:
            raise ValueError(f"Duplicate chapter table IDs: {', '.join(sorted(duplicates))}")
        tables.update(chapter_tables)
    return tables


def chapter_table_catalogue():
    return [
        {
            "table_id": table_id,
            "output_key": table_id,
            "chapter_number": chapter.CHAPTER_NUMBER,
            "chapter": f"Chapter {chapter.CHAPTER_NUMBER}",
            "chapter_title": chapter.CHAPTER_TITLE,
            "title": title,
            "output_sheet": table_id[:31],
            "source_variables": list(source_variables),
            "formula": formula,
        }
        for chapter in CHAPTER_MODULES
        for table_id, title, source_variables, formula in chapter.TABLE_SPECS
    ]