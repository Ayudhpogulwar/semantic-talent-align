"""
SAIOTAF - Faculty & Moderator Module
Bulk CSV Import helper for Opportunity postings (FR-FAC-03).

Kept isolated from views.py so it's independently unit-testable with plain
dicts -- no Django test client / HTTP layer required.
"""

from datetime import datetime


class CSVRowError(Exception):
    """Raised when a single CSV row fails structural parsing (before serializer validation)."""


REQUIRED_COLUMNS = [
    "organization_id", "title", "opportunity_type", "description",
    "work_mode", "application_deadline",
]


def parse_opportunity_csv_row(row: dict) -> dict:
    """
    Convert a raw CSV row (dict of strings) into the payload shape expected
    by OpportunitySerializer. Raises CSVRowError with a human-readable
    message on structural problems (missing columns, bad types) so the
    caller can report a precise row-level error to the faculty user.
    """
    missing = [col for col in REQUIRED_COLUMNS if not row.get(col)]
    if missing:
        raise CSVRowError(f"Missing required column(s): {', '.join(missing)}")

    try:
        deadline = datetime.fromisoformat(row["application_deadline"].strip())
    except ValueError as exc:
        raise CSVRowError(
            f"application_deadline must be ISO-8601 (e.g. 2026-09-30T23:59:00), got: {row['application_deadline']!r}"
        ) from exc

    required_skills_raw = row.get("required_skills", "")
    required_skills = [s.strip() for s in required_skills_raw.split("|") if s.strip()]

    is_unpaid = str(row.get("is_unpaid", "false")).strip().lower() in ("true", "1", "yes")

    compensation_amount = row.get("compensation_amount", "").strip()
    compensation_amount = float(compensation_amount) if compensation_amount else None

    duration_weeks = row.get("duration_weeks", "").strip()
    duration_weeks = int(duration_weeks) if duration_weeks else None

    positions_available = row.get("positions_available", "1").strip()
    positions_available = int(positions_available) if positions_available else 1

    return {
        "organization": row["organization_id"].strip(),
        "title": row["title"].strip(),
        "opportunity_type": row["opportunity_type"].strip().upper(),
        "description": row["description"].strip(),
        "required_skills": required_skills,
        "compensation_amount": compensation_amount,
        "is_unpaid": is_unpaid,
        "work_mode": row["work_mode"].strip().upper(),
        "location": row.get("location", "").strip() or None,
        "duration_weeks": duration_weeks,
        "application_deadline": deadline,
        "positions_available": positions_available,
    }
