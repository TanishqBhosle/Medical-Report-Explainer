import io
from typing import List, Dict, Any
from pathlib import Path
from pypdf import PdfReader, errors
from PIL import Image
from app.core.config import settings
from app.core.logging import logger

try:
    import pytesseract  # type: ignore[import-not-found, import-untyped]
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False


class PDFExtractor:
    @staticmethod
    def extract_text_pages(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text from PDF documents page-by-page supporting both digital text
        (preserving column layout) and scanned pages with OCR fallback.

        Defensive checks:
        - Password protection / encryption
        - Exceeding MAX_PAGE_LIMIT
        - Corrupt streams
        - Automatic fallback to embedded image OCR for scanned pages
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
                    # 1. Primary: Extract with layout preservation for column tables
                    layout_text = ""
                    try:
                        layout_text = page.extract_text(extraction_mode="layout") or ""
                    except Exception as le:
                        logger.debug(f"Layout extraction failed on page {idx}: {le}, falling back to plain extract")
                        layout_text = ""

                    # 2. Secondary: Plain extraction
                    plain_text = page.extract_text() or ""

                    # Clean whitespace artifacts (e.g. non-breaking spaces, carriage returns)
                    clean_layout = layout_text.replace("\xa0", " ").replace("\r", "").strip()
                    clean_plain = plain_text.replace("\xa0", " ").replace("\r", "").strip()

                    primary_text = clean_layout if len(clean_layout) >= len(clean_plain) else clean_plain
                    char_count = len(primary_text)
                    method = "DIGITAL_TEXT"

                    # 3. Defensive OCR Fallback: If page has little to no text, check for embedded scanned images
                    if char_count < 25 and HAS_PYTESSERACT:
                        ocr_snippets = []
                        try:
                            for img_idx, img_file in enumerate(page.images):
                                try:
                                    img_data = img_file.data
                                    with Image.open(io.BytesIO(img_data)) as pil_img:
                                        text_from_img = pytesseract.image_to_string(pil_img)
                                        if text_from_img.strip():
                                            ocr_snippets.append(text_from_img.strip())
                                except Exception as img_err:
                                    logger.debug(f"OCR failed for image {img_idx} on page {idx}: {img_err}")

                            if ocr_snippets:
                                ocr_combined = "\n".join(ocr_snippets).replace("\xa0", " ").strip()
                                if len(ocr_combined) > char_count:
                                    primary_text = ocr_combined
                                    char_count = len(primary_text)
                                    method = "IMAGE_OCR"
                        except Exception as ocr_err:
                            logger.debug(f"Page {idx} image enumeration error: {ocr_err}")

                    # Determine page readability status
                    if char_count > 20:
                        page_status = "READABLE"
                    elif char_count > 0:
                        page_status = "LOW_TEXT"
                    else:
                        page_status = "UNREADABLE"

                    results.append({
                        "page_number": idx,
                        "text": primary_text,
                        "plain_text": clean_plain,
                        "char_count": char_count,
                        "status": page_status,
                        "method": method
                    })

                except Exception as pe:
                    logger.warning(f"Error reading page {idx} in {path.name}: {pe}")
                    results.append({
                        "page_number": idx,
                        "text": "",
                        "plain_text": "",
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
