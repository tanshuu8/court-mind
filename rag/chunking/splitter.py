"""Legal semantic chunker with heading-awareness, page attribution, and stable IDs."""
import re
from typing import Any, Dict, List, Optional, Tuple


class LegalSemanticChunker:
    """Splits legal documents into coherent semantic chunks.

    Respects legal document structures:
    - Page boundaries and accurate page numbers
    - Paragraph numbering (e.g., 'Para 1.', '1.', '[1]')
    - Section and clause breaks (e.g., 'JUDGMENT:', 'ORDER:', 'HELD:')
    - Heading-aware section metadata preservation
    - Sentence-aware sliding window chunking when a paragraph exceeds chunk_size
    - Generates stable, deterministic chunk IDs including page reference
    - Preserves all parent document metadata (title, court, year, date) on each chunk
    """

    _HEADING_REGEX = re.compile(
        r"^(?:JUDGMENT|ORDER|REPORTABLE|NON-REPORTABLE|FACTS|ISSUES?|REASONING|HELD|"
        r"CONCLUSIONS?|POINTS?\s+FOR\s+CONSIDERATION|OPINION|BACKGROUND)\b[:\.]?|"
        r"^(?:Section\s+\d+[A-Za-z0-9\(\)]*|Article\s+\d+[A-Za-z0-9\(\)]*)\b|"
        r"^(?:Civil\s+Appeal|Criminal\s+Appeal|Special\s+Leave\s+Petition|Writ\s+Petition)\b",
        re.IGNORECASE,
    )

    def __init__(
        self,
        chunk_size: int = 1200,
        chunk_overlap: int = 150,
        respect_paragraphs: bool = True,
    ) -> None:
        if chunk_size <= chunk_overlap:
            raise ValueError("chunk_size must be strictly greater than chunk_overlap.")
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.respect_paragraphs = respect_paragraphs

    def split_document(self, parsed_document: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Splits parsed document into semantic chunks with page and metadata preservation.

        Args:
            parsed_document: Output dictionary from LegalDocumentParser containing
                             `doc_id`, `title`, `court`, `text`, `pages`, `metadata`, etc.

        Returns:
            List of chunk objects containing `chunk_id`, `doc_id`, `chunk_index`,
            `page_number`, `text`, and contextual `metadata`.
        """
        doc_id = parsed_document.get("doc_id", "DOC-UNKNOWN")
        pages = parsed_document.get("pages", [])
        parent_meta = parsed_document.get("metadata", {})
        title = parsed_document.get("title", parent_meta.get("title", "Unknown Case"))
        court = parsed_document.get("court", parent_meta.get("court", "Court"))
        year = parsed_document.get("year", parent_meta.get("year", "N/A"))

        if parsed_document.get("is_scanned", False):
            return []

        chunks: List[Dict[str, Any]] = []
        global_chunk_idx = 0
        active_heading: Optional[str] = None

        # 1. Page-aware chunking
        if pages and any(p.get("text", "").strip() for p in pages):
            for page in pages:
                page_num = page.get("page_number", 1)
                page_text = page.get("text", "").strip()
                if not page_text:
                    continue

                page_chunks, active_heading = self._chunk_text_block(page_text, active_heading)
                for chunk_text in page_chunks:
                    chunk_id = f"{doc_id}#p{page_num:03d}_c{global_chunk_idx:04d}"
                    chunk_meta = {
                        **parent_meta,
                        "chunk_id": chunk_id,
                        "doc_id": doc_id,
                        "chunk_index": global_chunk_idx,
                        "page_number": page_num,
                        "title": title,
                        "court": court,
                        "year": year,
                        "section_heading": active_heading or "General Judgment Body",
                        "char_length": len(chunk_text),
                        "word_count": len(chunk_text.split()),
                    }
                    chunks.append({
                        "chunk_id": chunk_id,
                        "doc_id": doc_id,
                        "chunk_index": global_chunk_idx,
                        "page_number": page_num,
                        "text": chunk_text,
                        "metadata": chunk_meta,
                    })
                    global_chunk_idx += 1
        else:
            # Fallback for plain text without page partitions
            text = parsed_document.get("text", "")
            if not text.strip():
                return []

            text_chunks, active_heading = self._chunk_text_block(text, active_heading)
            for idx, chunk_text in enumerate(text_chunks):
                chunk_id = f"{doc_id}#chunk_{idx:04d}"
                chunk_meta = {
                    **parent_meta,
                    "chunk_id": chunk_id,
                    "doc_id": doc_id,
                    "chunk_index": idx,
                    "page_number": 1,
                    "title": title,
                    "court": court,
                    "year": year,
                    "section_heading": active_heading or "General Judgment Body",
                    "char_length": len(chunk_text),
                    "word_count": len(chunk_text.split()),
                }
                chunks.append({
                    "chunk_id": chunk_id,
                    "doc_id": doc_id,
                    "chunk_index": idx,
                    "page_number": 1,
                    "text": chunk_text,
                    "metadata": chunk_meta,
                })

        total = len(chunks)
        for chunk in chunks:
            chunk["metadata"]["total_chunks_in_doc"] = total

        return chunks

    def _chunk_text_block(self, text: str, initial_heading: Optional[str] = None) -> Tuple[List[str], Optional[str]]:
        """Chunks a text block respecting paragraph boundaries and extracting legal headings."""
        current_heading = initial_heading
        if self.respect_paragraphs:
            raw_blocks = self._split_into_paragraphs(text)
        else:
            raw_blocks = [text]

        text_chunks: List[str] = []
        current_chunk_parts: List[str] = []
        current_len = 0

        for block in raw_blocks:
            block = block.strip()
            if not block:
                continue

            # Detect headings
            first_line = block.split("\n", 1)[0].strip()
            match = self._HEADING_REGEX.search(first_line)
            if match:
                current_heading = first_line[:60]

            block_len = len(block)

            # If single paragraph exceeds chunk size, sliding window split it
            if block_len > self.chunk_size:
                if current_chunk_parts:
                    text_chunks.append("\n\n".join(current_chunk_parts))
                    current_chunk_parts = []
                    current_len = 0

                sub_chunks = self._sliding_window_split(block)
                text_chunks.extend(sub_chunks)
                continue

            added_len = block_len if current_len == 0 else current_len + 2 + block_len
            if added_len <= self.chunk_size:
                current_chunk_parts.append(block)
                current_len = added_len
            else:
                text_chunks.append("\n\n".join(current_chunk_parts))
                overlap_text = self._get_overlap_text(current_chunk_parts)
                current_chunk_parts = [overlap_text, block] if overlap_text else [block]
                current_len = sum(len(p) for p in current_chunk_parts) + (2 if len(current_chunk_parts) > 1 else 0)

        if current_chunk_parts:
            text_chunks.append("\n\n".join(current_chunk_parts))

        return [c.strip() for c in text_chunks if c.strip()], current_heading

    def _split_into_paragraphs(self, text: str) -> List[str]:
        """Identifies legal paragraph boundaries such as 'Para 1.', numbered items, or double newlines."""
        paragraphs = re.split(r"\n\s*\n+", text)
        result: List[str] = []

        for p in paragraphs:
            sub_paras = re.split(r"(?:\r?\n)(?=(?:Para\s*\d+[\.:]?|\d+\.\s+|\[\d+\]))", p)
            for sp in sub_paras:
                if sp.strip():
                    result.append(sp.strip())

        return result

    def _sliding_window_split(self, long_text: str) -> List[str]:
        """Splits long text exceeding chunk_size using sentence-aware sliding window."""
        sentences = re.split(r"(?<=[.!?])\s+", long_text)
        chunks: List[str] = []
        current: List[str] = []
        cur_len = 0

        for sent in sentences:
            sent_len = len(sent)
            if cur_len + sent_len + 1 <= self.chunk_size:
                current.append(sent)
                cur_len += sent_len + 1
            else:
                if current:
                    chunk_str = " ".join(current)
                    chunks.append(chunk_str)
                    last_sent = current[-1]
                    if len(last_sent) < self.chunk_overlap:
                        current = [last_sent, sent]
                        cur_len = len(last_sent) + 1 + sent_len
                    else:
                        current = [sent]
                        cur_len = sent_len
                else:
                    start = 0
                    while start < len(sent):
                        end = start + self.chunk_size
                        chunks.append(sent[start:end])
                        start = end - self.chunk_overlap
                    current = []
                    cur_len = 0

        if current:
            chunks.append(" ".join(current))

        return chunks

    def _get_overlap_text(self, parts: List[str]) -> str:
        """Extracts tail text within chunk_overlap characters for continuity."""
        joined = " ".join(parts)
        if len(joined) <= self.chunk_overlap:
            return joined
        return joined[-self.chunk_overlap:]
