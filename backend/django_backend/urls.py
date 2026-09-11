from django.contrib import admin
from django.urls import path, include
from faculty_app.auth_views import FacultyLoginView, FacultyMFAVerifyView, FacultySignUpView
from api.admin_views import AdminLoginView, AdminStatsView, AdminUserManagementView, AdminUserActionView, AdminOverridesView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Super Admin API Endpoints & Secret Key Auth
    path('api/admin/auth/login/', AdminLoginView.as_view(), name='admin-auth-login'),
    path('api/admin/auth/login', AdminLoginView.as_view(), name='admin-auth-login-noslash'),
    path('api/auth/admin-login', AdminLoginView.as_view(), name='admin-auth-login-alt'),
    path('api/auth/admin-login/', AdminLoginView.as_view(), name='admin-auth-login-alt-slash'),
    path('api/admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('api/admin/users/', AdminUserManagementView.as_view(), name='admin-users'),
    path('api/admin/users/<int:user_id>/action/', AdminUserActionView.as_view(), name='admin-user-action'),
    path('api/admin/users/<int:user_id>/', AdminUserActionView.as_view(), name='admin-user-delete'),
    path('api/admin/overrides/', AdminOverridesView.as_view(), name='admin-overrides'),

    # Faculty Module Authentication
    path('api/v1/faculty/auth/login/', FacultyLoginView.as_view(), name='faculty-login'),
    path('api/v1/faculty/auth/login', FacultyLoginView.as_view(), name='faculty-login-noslash'),
    path('api/v1/faculty/auth/mfa/verify/', FacultyMFAVerifyView.as_view(), name='faculty-mfa-verify'),
    path('api/v1/faculty/auth/mfa/verify', FacultyMFAVerifyView.as_view(), name='faculty-mfa-verify-noslash'),
    path('api/v1/faculty/auth/signup/', FacultySignUpView.as_view(), name='faculty-signup'),
    path('api/v1/faculty/auth/signup', FacultySignUpView.as_view(), name='faculty-signup-noslash'),

    # Faculty Router Endpoints
    path('api/v1/faculty/', include('faculty_app.urls')),

    # JWT Token Refresh
    path('api/v1/auth/token/refresh/',
         __import__('rest_framework_simplejwt.views', fromlist=['TokenRefreshView']).TokenRefreshView.as_view(),
         name='token-refresh'),

    # Student Dashboard API
    path('api/', include('api.urls')),
]


