from typing import List, Dict, Any
from pathlib import Path
from PIL import Image
from app.core.logging import logger

try:
    import pytesseract  # type: ignore[import-not-found, import-untyped]
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False


class OCRExtractor:
    @staticmethod
    def extract_image_text(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text from image files (PNG/JPG).
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            image = Image.open(str(path))
            width, height = image.size

            extracted_text = ""
            if HAS_PYTESSERACT:
                try:
                    extracted_text = pytesseract.image_to_string(image)
                except Exception as te:
                    logger.warning(f"Tesseract OCR execution failed or binary not found: {te}")
                    extracted_text = ""

            return [{
                "page_number": 1,
                "text": extracted_text.strip(),
                "char_count": len(extracted_text.strip()),
                "dimensions": {"width": width, "height": height},
                "method": "OCR" if HAS_PYTESSERACT and extracted_text else "IMAGE_FALLBACK"
            }]
        except Exception as e:
            logger.error(f"Failed to process image {path.name}: {e}")
            raise
