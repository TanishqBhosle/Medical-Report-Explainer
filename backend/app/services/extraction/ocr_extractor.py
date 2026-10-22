from typing import List, Dict, Any
from pathlib import Path
from PIL import Image
from PIL.Image import DecompressionBombError
from app.core.logging import logger

# Set strict decompression bomb threshold (40 megapixels)
Image.MAX_IMAGE_PIXELS = 40_000_000

try:
    import pytesseract  # type: ignore[import-not-found, import-untyped]
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False


class OCRExtractor:
    @staticmethod
    def extract_image_text(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text from image files (PNG/JPG) with defensive checks for:
        - Image decompression bombs (huge pixel dimension attacks)
        - Corrupt image streams
        - Page-level unreadability
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            with Image.open(str(path)) as image:
                width, height = image.size
                total_pixels = width * height

                if total_pixels > Image.MAX_IMAGE_PIXELS:
                    raise ValueError(f"IMAGE_TOO_LARGE_DIMENSIONS: Image resolution ({width}x{height} = {total_pixels} pixels) exceeds the maximum safe limit.")

                extracted_text = ""
                if HAS_PYTESSERACT:
                    try:
                        extracted_text = pytesseract.image_to_string(image)
                    except Exception as te:
                        logger.warning(f"Tesseract OCR execution failed or binary not found: {te}")
                        extracted_text = ""

                clean_text = extracted_text.strip()
                char_count = len(clean_text)
                status = "READABLE" if char_count > 15 else "UNREADABLE"

                return [{
                    "page_number": 1,
                    "text": clean_text,
                    "char_count": char_count,
                    "dimensions": {"width": width, "height": height},
                    "status": status,
                    "method": "OCR" if HAS_PYTESSERACT and clean_text else "IMAGE_FALLBACK"
                }]

        except DecompressionBombError as e:
            logger.error(f"Image decompression bomb detected in {path.name}: {e}")
            raise ValueError(f"FILE_INVALID_OR_CORRUPT: Image decompression bomb detected: {e}")
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to process image {path.name}: {e}")
            raise ValueError(f"FILE_INVALID_OR_CORRUPT: Corrupted or unreadable image file: {str(e)}")
