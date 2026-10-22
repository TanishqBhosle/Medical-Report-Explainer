from typing import List, Dict, Any
from pathlib import Path
from pypdf import PdfReader, errors
from app.core.config import settings
from app.core.logging import logger


class PDFExtractor:
    @staticmethod
    def extract_text_pages(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text from a digital PDF per page with defensive checks for:
        - Password protection / encryption
        - Exceeding page limits
        - Corrupt PDF streams
        - Page-level unreadability tracking
        """
        results = []
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            reader = PdfReader(str(path))

            # Edge Case: Encrypted or password-protected PDF
            if reader.is_encrypted:
                logger.warning(f"Rejected password-protected PDF: {path.name}")
                raise ValueError("FILE_PASSWORD_PROTECTED: The uploaded PDF is password-protected or encrypted. Please remove encryption before uploading.")

            total_pages = len(reader.pages)

            # Edge Case: Page limit enforcement
            if total_pages > settings.MAX_PAGE_LIMIT:
                logger.warning(f"Rejected PDF exceeding page limit ({total_pages} > {settings.MAX_PAGE_LIMIT}): {path.name}")
                raise ValueError(f"PAGE_LIMIT_EXCEEDED: Document contains {total_pages} pages, which exceeds the limit of {settings.MAX_PAGE_LIMIT} pages.")

            if total_pages == 0:
                raise ValueError("FILE_INVALID_OR_CORRUPT: PDF contains zero pages.")

            for idx, page in enumerate(reader.pages, start=1):
                try:
                    extracted = page.extract_text() or ""
                    clean_text = extracted.strip()
                    char_count = len(clean_text)

                    # Defensive page readability tracking
                    page_status = "READABLE" if char_count > 20 else ("LOW_TEXT" if char_count > 0 else "UNREADABLE")

                    results.append({
                        "page_number": idx,
                        "text": clean_text,
                        "char_count": char_count,
                        "status": page_status
                    })
                except Exception as pe:
                    logger.warning(f"Error reading page {idx} in {path.name}: {pe}")
                    results.append({
                        "page_number": idx,
                        "text": "",
                        "char_count": 0,
                        "status": "UNREADABLE",
                        "error": str(pe)
                    })

            logger.info(f"Extracted {total_pages} pages from PDF {path.name}")
            return results

        except (errors.PdfStreamError, errors.EmptyFileError) as e:
            logger.error(f"Corrupt PDF stream in {path.name}: {e}")
            raise ValueError(f"FILE_INVALID_OR_CORRUPT: The PDF file is corrupted and cannot be parsed. ({str(e)})")
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to extract PDF text from {path.name}: {e}")
            raise ValueError(f"FILE_INVALID_OR_CORRUPT: Error parsing PDF structure: {str(e)}")
