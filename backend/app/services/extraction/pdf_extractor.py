from typing import List, Dict, Any
from pathlib import Path
from pypdf import PdfReader
from app.core.logging import logger


class PDFExtractor:
    @staticmethod
    def extract_text_pages(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text from a digital PDF per page.
        Returns a list of dicts: {"page_number": int, "text": str, "char_count": int}
        """
        results = []
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            reader = PdfReader(str(path))
            total_pages = len(reader.pages)
            for idx, page in enumerate(reader.pages, start=1):
                extracted = page.extract_text() or ""
                results.append({
                    "page_number": idx,
                    "text": extracted.strip(),
                    "char_count": len(extracted.strip())
                })
            logger.info(f"Extracted {total_pages} pages from PDF {path.name}")
            return results
        except Exception as e:
            logger.error(f"Failed to extract PDF text from {path.name}: {e}")
            raise
