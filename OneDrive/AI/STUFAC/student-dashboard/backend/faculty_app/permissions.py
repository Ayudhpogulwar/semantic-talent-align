"""
SAIOTAF - Faculty & Moderator Module
Role-Based Access Control (RBAC) permission classes.

These enforce FR-FAC-01 (secure, role-scoped access) at the API layer --
never trust frontend route-guarding alone (NFR-Security).
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Faculty


class IsFacultyUser(BasePermission):
    """Base gate: request.user must have an active Faculty profile."""

    message = "Only authenticated faculty/moderator accounts may access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            # Try to authenticate using SimpleJWT's JWTAuthentication
            from rest_framework_simplejwt.authentication import JWTAuthentication
            try:
                auth_result = JWTAuthentication().authenticate(request)
                if auth_result:
                    request.user, _ = auth_result
            except Exception:
                pass

        if not request.user or not request.user.is_authenticated:
            return False

        faculty = getattr(request.user, "faculty_profile", None)
        if not faculty:
            # Check if user is linked to faculty table directly
            faculty = Faculty.objects.filter(user=request.user, is_active=True).first()
        return bool(faculty and faculty.is_active)


class IsSuperAdminOrDeptAdmin(IsFacultyUser):
    """
    Reserved for high-privilege actions: organization suspension,
    faculty account management, report configuration overrides.
    """

    message = "This action requires Department Admin or Super Admin privileges."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        role = request.user.faculty_profile.role
        return role in (Faculty.Role.DEPARTMENT_ADMIN, Faculty.Role.SUPER_ADMIN)


class CanApproveOpportunities(IsFacultyUser):
    """Moderators and above can approve/reject opportunity postings."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        if request.method in SAFE_METHODS:
            return True
        role = request.user.faculty_profile.role
        return role in (
            Faculty.Role.MODERATOR,
            Faculty.Role.PLACEMENT_OFFICER,
            Faculty.Role.DEPARTMENT_ADMIN,
            Faculty.Role.SUPER_ADMIN,
        )


class ReadOnlyOrFacultyWrite(IsFacultyUser):
    """
    Generic mixin: GET is allowed for any authenticated faculty account;
    mutating verbs require an active Faculty profile explicitly (already
    enforced by IsFacultyUser), kept as a semantic alias for CRUD viewsets.
    """

    def has_permission(self, request, view):
        return super().has_permission(request, view)
