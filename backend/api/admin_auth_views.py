"""
SAIOTAF - Super Admin Module
Admin Authentication endpoints.

Provides:
  POST /api/admin/auth/login/          - Login with email + password + secret key
  POST /api/admin/auth/register/       - Register admin with full_name, email, password, secret key
  POST /api/admin/auth/reset-password/ - Reset password with email + secret key + new_password
"""

import jwt
import time
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

User = get_user_model()

# Secret key for JWT encoding (matches student module)
JWT_SECRET = "saiotaf_jwt_secret_python_key_2026"
JWT_ALGORITHM = "HS256"

# Admin portal secret access key (hardcoded security gate)
ADMIN_PORTAL_SECRET = "SAI88202"

VALID_EMAIL_DOMAIN = "@raisoni.net"


def _validate_admin_email(email: str) -> bool:
    return email.strip().lower().endswith(VALID_EMAIL_DOMAIN)


def _issue_admin_token(email: str, full_name: str) -> str:
    payload = {
        "sub": email,
        "full_name": full_name,
        "role": "SUPER_ADMIN",
        "exp": int(time.time()) + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """Admin login: requires email + password + secret_key."""
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '').strip()
    secret_key = request.data.get('secret_key', '').strip()

    if not email or not password or not secret_key:
        return Response(
            {"error": "All fields (email, password, and secret_key) are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not _validate_admin_email(email):
        return Response(
            {"error": f"Admin access requires a valid {VALID_EMAIL_DOMAIN} institutional email."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if secret_key != ADMIN_PORTAL_SECRET:
        return Response(
            {"error": "Unauthorized: Invalid Secret Access Key."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Try Django user auth
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response(
            {"error": "No admin account found with this email."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    full_name = f"{user.first_name} {user.last_name}".strip() or user.username
    token = _issue_admin_token(email, full_name)

    return Response({
        "status": "success",
        "token": token,
        "full_name": full_name,
        "email": email,
        "role": "SUPER_ADMIN"
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_register(request):
    """Admin registration: requires full_name, email, password, secret_key."""
    full_name = request.data.get('full_name', '').strip()
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '').strip()
    secret_key = request.data.get('secret_key', '').strip()

    # Validate required fields
    if not full_name:
        return Response({"error": "Full Name is required."}, status=status.HTTP_400_BAD_REQUEST)

    if not email:
        return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

    if not _validate_admin_email(email):
        return Response(
            {"error": f"Admin registration requires a valid {VALID_EMAIL_DOMAIN} institutional email."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not password or len(password) < 6:
        return Response({"error": "Password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)

    if not secret_key or secret_key != ADMIN_PORTAL_SECRET:
        return Response(
            {"error": "Unauthorized: Invalid Secret Access Key. Admin registration is restricted."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Check for existing user
    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"error": "An account with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Parse name parts
    name_parts = full_name.split(' ', 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ''

    with transaction.atomic():
        user = User.objects.create_user(
            username=email.split('@')[0],
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        user.is_staff = True  # Mark as admin staff
        user.save()

    token = _issue_admin_token(email, full_name)

    return Response({
        "status": "success",
        "message": "Admin account created successfully.",
        "token": token,
        "full_name": full_name,
        "email": email,
        "role": "SUPER_ADMIN"
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_reset_password(request):
    """Admin password reset: requires email + secret_key + new_password."""
    email = request.data.get('email', '').strip().lower()
    secret_key = request.data.get('secret_key', '').strip()
    new_password = request.data.get('new_password', '').strip()

    if not email or not secret_key or not new_password:
        return Response(
            {"error": "Email, secret_key, and new_password are all required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not _validate_admin_email(email):
        return Response(
            {"error": f"Admin password reset requires a valid {VALID_EMAIL_DOMAIN} institutional email."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if secret_key != ADMIN_PORTAL_SECRET:
        return Response(
            {"error": "Unauthorized: Invalid Secret Access Key."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if len(new_password) < 6:
        return Response({"error": "New password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response(
            {"error": "No admin account found with this email."},
            status=status.HTTP_404_NOT_FOUND
        )

    user.set_password(new_password)
    user.save()

    return Response({
        "status": "success",
        "message": "Admin password reset successfully. You can now sign in with your new password."
    }, status=status.HTTP_200_OK)
