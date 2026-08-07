"""
SAIOTAF - Project root URL configuration.
Demonstrates clean module boundary: faculty_app and student_app (teammate's
module) are mounted at sibling paths with zero cross-imports.
"""

from django.contrib import admin
from django.urls import path, include
from faculty_app.auth_views import FacultyLoginView, FacultyMFAVerifyView, FacultySignUpView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Faculty module (this deliverable)
    path("api/v1/faculty/auth/login/", FacultyLoginView.as_view(), name="faculty-login"),
    path("api/v1/faculty/auth/mfa/verify/", FacultyMFAVerifyView.as_view(), name="faculty-mfa-verify"),
    path("api/v1/faculty/auth/signup/", FacultySignUpView.as_view(), name="faculty-signup"),
    path("api/v1/faculty/", include("faculty_app.urls")),

    # Student module (teammate's concurrent deliverable) -- mounted the same
    # way, no shared code required beyond the DB-level FK conventions
    # documented in faculty_app/models.py.
    # path("api/v1/students/", include("student_app.urls")),

    # Shared JWT token refresh (framework-provided, not module-specific)
    path("api/v1/auth/token/refresh/",
         __import__("rest_framework_simplejwt.views", fromlist=["TokenRefreshView"]).TokenRefreshView.as_view(),
         name="token-refresh"),
]
