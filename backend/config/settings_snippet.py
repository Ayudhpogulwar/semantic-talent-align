"""
SAIOTAF - Settings snippet to merge into the project's settings.py.
Covers FR-FAC-01: JWT session management with enforced timeouts + MFA scaffold.

Install:
    pip install djangorestframework djangorestframework-simplejwt \
                django-filter django-otp qrcode openpyxl reportlab mysqlclient
"""

from datetime import timedelta

INSTALLED_APPS = [
    # ... core Django apps ...
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "rest_framework",
    "rest_framework_simplejwt",
    "django_filters",
    "django_otp",                 # MFA (TOTP) support
    "django_otp.plugins.otp_totp",
    "faculty_app",
    # "student_app",  # owned by teammate, mounted independently
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "user": "1000/day",
    },
}

# --- JWT: enforced session timeout per NFR-Security ---
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),   # short-lived access token
    "REFRESH_TOKEN_LIFETIME": timedelta(hours=8),     # matches a typical workday session
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "AUTH_HEADER_TYPES": ("Bearer",),
}

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "saiotaf",
        "USER": "saiotaf_app",
        "PASSWORD": "${DB_PASSWORD}",   # inject via environment variable, never hardcode
        "HOST": "${DB_HOST}",
        "PORT": "3306",
        "OPTIONS": {"charset": "utf8mb4"},
    }
}
