"""
SAIOTAF - Faculty & Moderator Module
URL Routing.

Mounted under /api/v1/faculty/ from the project root urls.py (see
config/urls.py) so the Student module can be mounted independently under
/api/v1/students/ with zero path collisions.
"""

from rest_framework.routers import DefaultRouter

from .views import (
    StudentVerificationViewSet,
    OrganizationViewSet,
    OpportunityViewSet,
    CertificateViewSet,
    AuditLogViewSet,
    ReportViewSet,
)

router = DefaultRouter()
router.register("student-verifications", StudentVerificationViewSet, basename="student-verification")
router.register("organizations", OrganizationViewSet, basename="organization")
router.register("opportunities", OpportunityViewSet, basename="opportunity")
router.register("certificates", CertificateViewSet, basename="certificate")
router.register("audit-log", AuditLogViewSet, basename="audit-log")
router.register("reports", ReportViewSet, basename="report")

urlpatterns = router.urls

# Resulting endpoints include, among others:
#   GET    /api/v1/faculty/student-verifications/
#   POST   /api/v1/faculty/student-verifications/{id}/review/
#   GET    /api/v1/faculty/organizations/
#   POST   /api/v1/faculty/organizations/{id}/verify/
#   GET    /api/v1/faculty/opportunities/
#   POST   /api/v1/faculty/opportunities/
#   POST   /api/v1/faculty/opportunities/{id}/approval/
#   POST   /api/v1/faculty/opportunities/bulk-import/
#   GET    /api/v1/faculty/certificates/
#   POST   /api/v1/faculty/certificates/{id}/review/
#   GET    /api/v1/faculty/audit-log/
#   GET    /api/v1/faculty/reports/funnel/
#   GET    /api/v1/faculty/reports/skill-gaps/
#   GET    /api/v1/faculty/reports/export/?format=pdf
