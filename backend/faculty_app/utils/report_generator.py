"""
SAIOTAF - Faculty & Moderator Module
Report generation for accreditation / department summaries (FR-FAC-07).

Two export formats are supported:
  - xlsx via openpyxl
  - pdf  via reportlab

This module returns raw bytes + content-type + filename so the calling view
stays a thin HTTP adapter (testable independent of Django's response cycle).
"""

import io
from datetime import datetime


def _fetch_report_dataset(department: str | None, term: str | None) -> list[dict]:
    """
    TODO(integration): replace with a real aggregation query once this
    module has read access to the Application/Placement tables (owned by
    the core backend team) and the Recommendation History store (AI engine).
    Returns a list of row-dicts in the interim to keep the export functions
    fully implemented and testable against a stable contract.
    """
    return [
        {"department": department or "All", "term": term or "Current",
         "students_placed": 0, "total_students": 0, "placement_rate": "0%"},
    ]


def generate_placement_report(fmt: str, department: str | None, term: str | None):
    dataset = _fetch_report_dataset(department, term)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    if fmt == "xlsx":
        return _generate_xlsx(dataset, timestamp)
    return _generate_pdf(dataset, timestamp)


def _generate_xlsx(dataset, timestamp):
    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    ws.title = "Placement Report"

    if dataset:
        headers = list(dataset[0].keys())
        ws.append(headers)
        for row in dataset:
            ws.append([row[h] for h in headers])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    filename = f"placement_report_{timestamp}.xlsx"
    content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return buffer.getvalue(), content_type, filename


def _generate_pdf(dataset, timestamp):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [Paragraph("SAIOTAF Placement Report", styles["Title"]), Spacer(1, 16)]

    if dataset:
        headers = list(dataset[0].keys())
        table_data = [headers] + [[str(row[h]) for h in headers] for row in dataset]
        table = Table(table_data)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))
        story.append(table)

    doc.build(story)
    buffer.seek(0)

    filename = f"placement_report_{timestamp}.pdf"
    return buffer.getvalue(), "application/pdf", filename
