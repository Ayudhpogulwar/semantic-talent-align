from django.contrib import admin
from django.urls import path, include
from faculty_app.auth_views import FacultyLoginView, FacultyMFAVerifyView, FacultySignUpView

urlpatterns = [
    path('admin/', admin.site.urls),

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

