import json
from pathlib import Path
from typing import Any, Dict, List, Optional


class AdvocateMatcher:
    """Manages advocate discovery and matches suitable legal practitioners.

    Matching uses real, persisted advocate profiles with transparent criteria:
    - Practice area
    - Court and jurisdiction
    - Location
    - Experience years
    - Verification status (clearly distinguishing verified from unverified)
    - Consultation preferences

    Never fabricates ratings, success rates, or unverified credentials.
    """

    def __init__(self, data_file: Optional[Path] = None) -> None:
        if data_file:
            self.data_file = Path(data_file)
        else:
            root = Path(__file__).resolve().parent.parent.parent
            self.data_file = root / "data" / "advocates.json"

        self._profiles = self._load_profiles()

    def _load_profiles(self) -> List[Dict[str, Any]]:
        """Loads persisted advocate profiles from disk."""
        if not self.data_file.exists():
            return []
        try:
            return json.loads(self.data_file.read_text(encoding="utf-8"))
        except Exception:
            return []

    def find_suitable_advocates(
        self,
        practice_area: Optional[str] = None,
        court: Optional[str] = None,
        location: Optional[str] = None,
        verified_only: bool = False,
    ) -> Dict[str, Any]:
        """Finds advocates matching the specified practice area, court, and location.

        Returns:
            Dictionary containing match results, match criteria, and empty-state handling.
        """
        if not self._profiles:
            return {
                "status": "empty",
                "message": "Advocate registry is currently empty.",
                "criteria_applied": {},
                "total_matched": 0,
                "advocates": [],
            }

        matched: List[Dict[str, Any]] = []

        for p in self._profiles:
            # 1. Verification filter
            if verified_only and not p.get("verified", False):
                continue

            # 2. Practice area matching
            score = 0
            if practice_area:
                p_lower = practice_area.lower()
                area_match = any(
                    p_lower in area.lower() or area.lower() in p_lower
                    for area in p.get("practice_areas", [])
                )
                if area_match:
                    score += 2
                else:
                    # If specific area was requested but not found, skip unless loosely related
                    continue

            # 3. Court matching
            if court:
                c_lower = court.lower()
                court_match = any(
                    c_lower in c.lower() or c.lower() in c_lower
                    for c in p.get("courts", [])
                )
                if court_match:
                    score += 1

            # 4. Location matching
            if location:
                if location.lower() in p.get("location", "").lower():
                    score += 1

            matched.append({
                "advocate_id": p.get("advocate_id"),
                "name": p.get("name"),
                "practice_areas": p.get("practice_areas", []),
                "courts": p.get("courts", []),
                "location": p.get("location"),
                "experience_years": p.get("experience_years"),
                "verified": p.get("verified", False),
                "verification_badge": "Verified Practitioner" if p.get("verified") else "Unverified Profile",
                "consultation_preferences": p.get("consultation_preferences"),
                "match_relevance_score": score,
            })

        # Sort by verified status first, then by match score and experience
        matched.sort(
            key=lambda x: (x["verified"], x["match_relevance_score"], x["experience_years"]),
            reverse=True,
        )

        criteria = {
            "practice_area": practice_area or "Any",
            "court": court or "Any",
            "location": location or "Any",
            "verified_only": verified_only,
        }

        if not matched:
            return {
                "status": "no_matches",
                "message": (
                    f"No advocate profiles found matching criteria: Practice='{criteria['practice_area']}', "
                    f"Court='{criteria['court']}', Location='{criteria['location']}'."
                ),
                "criteria_applied": criteria,
                "total_matched": 0,
                "advocates": [],
            }

        return {
            "status": "success",
            "message": f"Found {len(matched)} suitable advocate(s).",
            "criteria_applied": criteria,
            "total_matched": len(matched),
            "advocates": matched,
        }

    def generate_advocate_cta(
        self,
        practice_area: Optional[str] = None,
        court: Optional[str] = None,
        origin_source: str = "rag_document",
    ) -> Dict[str, Any]:
        """Generates a non-blocking Call to Action (CTA) for the UI."""
        area_label = practice_area or "this legal domain"
        court_label = court or "the relevant court"

        return {
            "cta_title": "Find a Suitable Advocate",
            "cta_description": f"Consult verified legal practitioners with expertise in {area_label} before {court_label}.",
            "target_route": "/advocates",
            "non_blocking": True,
            "context_payload": {
                "practice_area": practice_area,
                "court": court,
                "origin_source": origin_source,
            },
        }
