import re
import hashlib
from typing import Any, Dict, List, Optional


class LegalDocumentParser:
    """Parses legal court orders, petitions, and judgments into structured text.

    Extracts concise, accurate metadata:
    - Case Title (Appellant vs Respondent or Petitioner vs Respondent, bounded to avoid body text)
    - Court (e.g. Supreme Court of India, High Court of Delhi)
    - Document ID / Appeal Number / Citation
    - Year and Decision Date
    - Bench
    - Page references
    """

    def __init__(self) -> None:
        pass

    def parse(self, raw_document: Dict[str, Any]) -> Dict[str, Any]:
        """Parses a document wrapper dictionary returned by DocumentLoader.

        Args:
            raw_document: Dict with 'content', 'pages', 'is_scanned', and 'metadata'.

        Returns:
            Dict containing normalized metadata fields and cleaned text body.
        """
        content = raw_document.get("content", "")
        pages = raw_document.get("pages", [])
        is_scanned = raw_document.get("is_scanned", False)
        file_meta = raw_document.get("metadata", {})
        source_path = file_meta.get("source", "")
        file_stem = file_meta.get("file_stem", "doc")

        if is_scanned:
            return {
                "doc_id": f"SCANNED-{file_stem}",
                "title": file_stem.replace("_", " ").title(),
                "court": "Unknown",
                "year": "Unknown",
                "decision_date": "Unknown",
                "bench": "Unknown",
                "source": source_path,
                "text": "",
                "pages": [],
                "is_scanned": True,
                "ocr_required": True,
                "error": "Document appears to be a scanned image-only PDF without selectable text. OCR is required.",
                "metadata": {
                    "is_scanned": True,
                    "ocr_required": True,
                    "source": source_path,
                    "file_meta": file_meta,
                },
            }

        # Clean non-ascii artifacts for reliable regex matching
        clean_header_text = re.sub(r"[^\x20-\x7E\n]", " ", content[:4000])

        # 1. Title Extraction (Strict multi-pass extraction to prevent body-text leakage)
        title = self._extract_clean_title(clean_header_text, file_stem)

        # 2. Case Number / Doc ID extraction
        doc_id = self._extract_doc_id(clean_header_text, title, file_stem)

        # 3. Court extraction
        court = self._extract_court(clean_header_text)

        # 4. Date & Year extraction
        decision_date, year = self._extract_date_and_year(clean_header_text)

        # 5. Bench extraction
        bench = self._extract_bench(clean_header_text)

        # 6. Source / Citation
        source = self._extract_field(clean_header_text, r"(?:Citation|Equivalent citations|Source):\s*(.+)")
        if not source:
            source = source_path or "CourtMind Legal Archive"

        body_text = self._clean_body_text(content)

        metadata: Dict[str, Any] = {
            "doc_id": doc_id,
            "title": title,
            "court": court,
            "year": year,
            "decision_date": decision_date,
            "bench": bench or "Not Specified",
            "source": source,
            "page_count": len(pages),
            "is_scanned": False,
            "ocr_required": False,
            "file_meta": file_meta,
        }

        return {
            "doc_id": doc_id,
            "title": title,
            "court": court,
            "year": year,
            "decision_date": decision_date,
            "bench": bench or "Not Specified",
            "source": source,
            "text": body_text,
            "pages": pages,
            "is_scanned": False,
            "ocr_required": False,
            "metadata": metadata,
        }

    def _extract_clean_title(self, text: str, fallback_stem: str) -> str:
        """Extracts a concise, genuine party title without capturing body text paragraphs."""
        # 1. Explicit Case Title header
        explicit = self._extract_field(text, r"(?:Case Title|Title):\s*(.+)")
        if explicit and len(explicit) <= 120 and "judgment" not in explicit.lower():
            return explicit.strip()

        # 2. Indian Kanoon top line format: 'X vs Y on [Date]'
        for line in text.split("\n"):
            line_str = line.strip()
            km = re.search(r"^([A-Za-z0-9\.\s,\(\)]+?\s+(?:vs\.?|v\.)\s+[A-Za-z0-9\.\s,\(\)]+?)\s+on\s+[0-9]", line_str, re.IGNORECASE)
            if km:
                t = km.group(1).strip()
                if len(t) <= 100:
                    return self._format_title(t)

        # 3. Appellant / Respondent with Versus (e.g. Civil Case)
        app_resp = re.search(
            r"([A-Za-z0-9\.\s,\(\)/]+?)\s*Appellant(?:\(s\))?\s*\n?\s*Versus\s*\n?\s*([A-Za-z0-9\.\s,\(\)/]+?)\s*Respondent(?:\(s\))?",
            text,
            re.IGNORECASE,
        )
        if app_resp:
            app_raw = app_resp.group(1).strip()
            app_lines = [
                l.strip() for l in app_raw.split("\n")
                if l.strip() and not l.strip().startswith("(") and "APPEAL" not in l.upper() and "JURISDICTION" not in l.upper()
            ]
            app = " ".join(app_lines[-2:]) if len(app_lines) >= 2 else (app_lines[0] if app_lines else "")

            resp_raw = app_resp.group(2).strip()
            resp_lines = [l.strip() for l in resp_raw.split("\n") if l.strip()]
            resp = resp_lines[0] if resp_lines else ""

            if app and resp and len(app) < 80 and len(resp) < 80:
                return self._format_title(f"{app} v. {resp}")

        # 4. PETITIONER: ... Vs. RESPONDENT: ...
        pet_resp = re.search(
            r"PETITIONER:?\s*\n?\s*([A-Za-z0-9\.\s,\(\)/-]+?)\s*\n?\s*(?:Vs\.?|Versus)\s*\n?\s*RESPONDENT:?\s*\n?\s*([A-Za-z0-9\.\s,\(\)/-]+)",
            text,
            re.IGNORECASE,
        )
        if pet_resp:
            pet_lines = [l.strip() for l in pet_resp.group(1).split("\n") if l.strip()]
            pet = pet_lines[0] if pet_lines else ""

            resp_lines = [l.strip() for l in pet_resp.group(2).split("\n") if l.strip()]
            resp = resp_lines[0] if resp_lines else ""
            resp = re.split(r"(?:DATE OF JUDGMENT|BENCH|CITATION|\n)", resp, flags=re.IGNORECASE)[0].strip()

            if pet and resp and len(pet) < 80 and len(resp) < 80:
                return self._format_title(f"{pet} v. {resp}")

        # 5. Single line with ' v. ' or ' vs. '
        for line in text.split("\n"):
            line_str = line.strip()
            if 10 < len(line_str) <= 90:
                v_match = re.search(r"^([A-Z0-9\.\s,'\(\)]+\s+(?:v\.|vs\.|Versus)\s+[A-Z0-9\.\s,'\(\)]+)$", line_str, re.IGNORECASE)
                if v_match:
                    return self._format_title(v_match.group(1).strip())

        return fallback_stem.replace("_", " ").title()

    def _extract_doc_id(self, text: str, title: str, fallback_stem: str) -> str:
        """Extracts formal case number or citation identifier."""
        # Check explicit ID header
        explicit = self._extract_field(text, r"(?:Document ID|Doc ID|Case No\.?|Appeal No\.?):\s*(.+)")
        if explicit and len(explicit) < 80:
            return explicit.strip()

        # Check Civil Appeal / Criminal Appeal / SLP patterns
        appeal_match = re.search(
            r"(CIVIL\s+APPEAL\s+NO\.\s*[0-9\s]+OF\s*[0-9]{4}|CRIMINAL\s+APPEAL\s+NO\.\s*[0-9\s]+OF\s*[0-9]{4}|WRIT\s+PETITION\s*\(?[A-Za-z]*\)?\s*NO\.\s*[0-9\s]+OF\s*[0-9]{4})",
            text,
            re.IGNORECASE,
        )
        if appeal_match:
            return re.sub(r"\s+", " ", appeal_match.group(1)).strip().upper()

        # Check Law Report Citation (e.g. 1980 AIR 267)
        cit_match = re.search(r"(?:CITATION:\s*\n?\s*)(\d{4}\s+AIR\s+\d+)", text, re.IGNORECASE)
        if cit_match:
            return cit_match.group(1).strip()

        # Deterministic fallback based on title and year
        short_hash = hashlib.sha256(title.encode("utf-8")).hexdigest()[:8]
        year_match = re.search(r"\b(19\d\d|20\d\d)\b", text)
        year_part = year_match.group(1) if year_match else "XXXX"
        return f"DOC-{year_part}-{short_hash}"

    def _extract_court(self, text: str) -> str:
        """Extracts court name."""
        court_header = self._extract_field(text, r"(?:Court):\s*(.+)")
        if court_header:
            return court_header

        court_match = re.search(r"(Supreme Court of India|High Court of [A-Za-z ]+|District Court of [A-Za-z ]+)", text, re.IGNORECASE)
        if court_match:
            c_str = court_match.group(1).strip()
            words = c_str.split()
            return " ".join(w.lower() if w.lower() in ("of", "the", "in") else w.capitalize() for w in words)

        return "Supreme Court of India"

    def _extract_date_and_year(self, text: str) -> tuple[str, str]:
        """Extracts decision date and 4-digit year."""
        date_str = self._extract_field(text, r"(?:Date of Decision|Decision Date|Dated|Date):\s*([0-9A-Za-z/,\s.-]+)")
        if not date_str:
            judg_date_match = re.search(r"DATE OF JUDGMENT\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})", text, re.IGNORECASE)
            if judg_date_match:
                date_str = judg_date_match.group(1).strip()

        year_match = re.search(r"\b(19\d\d|20\d\d)\b", date_str or text)
        year = year_match.group(1) if year_match else "Unknown"

        if not date_str:
            date_str = f"Year {year}" if year != "Unknown" else "Unknown"

        return date_str.strip(), year

    def _extract_bench(self, text: str) -> Optional[str]:
        """Extracts Bench / Judges."""
        bench = self._extract_field(text, r"(?:Bench|Coram|Before):\s*(.+)")
        if not bench:
            # Look for line ending with ', J.' or 'JJ.'
            j_match = re.search(r"^([A-Z\.\s,]+(?:,\s*J\.|\s+JJ\.))", text, re.MULTILINE)
            if j_match:
                bench = j_match.group(1).strip()
        return bench

    def _format_title(self, title: str) -> str:
        """Formats title casing cleanly."""
        cleaned = re.sub(r"\s+", " ", title).strip()
        words = cleaned.split()
        return " ".join(
            w.lower() if w.lower() in ("v.", "vs.", "and", "of", "or", "in", "through", "etc.") else w.capitalize()
            for w in words
        )

    def _extract_field(self, content: str, pattern: str) -> Optional[str]:
        """Extract first matching group or None."""
        match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return None

    def _clean_body_text(self, content: str) -> str:
        """Removes duplicate blank lines and cleans boilerplate markers."""
        text = content.replace("\r\n", "\n").replace("\r", "\n")
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
        cleaned_lines = []
        blank = False
        for line in lines:
            if not line:
                if not blank:
                    cleaned_lines.append("")
                    blank = True
            else:
                cleaned_lines.append(line)
                blank = False
        return "\n".join(cleaned_lines).strip()
