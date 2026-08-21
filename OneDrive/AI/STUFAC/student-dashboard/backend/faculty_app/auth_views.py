"""
SAIOTAF - Faculty & Moderator Module
Authentication endpoints (FR-FAC-01).

Two-step login flow when MFA is enabled:
  1. POST /api/v1/faculty/auth/login/       -> validates password, returns
                                                either full JWT pair (MFA off)
                                                or a short-lived `mfa_token`
                                                (MFA on).
  2. POST /api/v1/faculty/auth/mfa/verify/  -> exchanges mfa_token + TOTP
                                                code for the full JWT pair.

This mirrors how django-otp + simplejwt are typically composed without
requiring a hard dependency between this module and the Student module's
own (separately scoped) auth flow.
"""

from django.contrib.auth import authenticate
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Faculty


class LoginSerializer(serializers.Serializer):
    employee_id = serializers.CharField()
    password = serializers.CharField(write_only=True)


class MFAVerifySerializer(serializers.Serializer):
    mfa_token = serializers.CharField()
    otp_code = serializers.CharField(min_length=6, max_length=6)


def _issue_tokens(user) -> dict:
    refresh = RefreshToken.for_user(user)
    access_token = refresh.access_token
    access_token["username"] = user.username
    access_token["first_name"] = user.first_name
    access_token["last_name"] = user.last_name
    
    faculty_role = "Faculty"
    if hasattr(user, "faculty_profile") and user.faculty_profile:
        faculty_role = user.faculty_profile.role
    access_token["role"] = faculty_role

    return {
        "access": str(access_token),
        "refresh": str(refresh),
        "user": {
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": faculty_role
        }
    }


class FacultyLoginView(APIView):
    """Step 1 of login: password check, then branch on MFA status."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee_id = serializer.validated_data["employee_id"]
        password = serializer.validated_data["password"]

        from django.db.models import Q
        try:
            faculty = Faculty.objects.select_related("user").get(
                Q(employee_id=employee_id) |
                Q(user__username=employee_id) |
                Q(user__email=employee_id),
                is_active=True
            )
        except Faculty.DoesNotExist:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(request, username=faculty.user.username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        if faculty.mfa_enabled:
            # Short-lived (5 min) intermediate token that ONLY authorizes
            # the MFA verification step -- it must not be usable against any
            # other endpoint. In production, encode a `scope: "mfa_pending"`
            # claim and check it in a dedicated permission class.
            mfa_token = AccessToken.for_user(user)
            mfa_token.set_exp(lifetime=__import__("datetime").timedelta(minutes=5))
            mfa_token["scope"] = "mfa_pending"
            return Response(
                {"mfa_required": True, "mfa_token": str(mfa_token)},
                status=status.HTTP_200_OK,
            )

        return Response({"mfa_required": False, **_issue_tokens(user)}, status=status.HTTP_200_OK)


class FacultyMFAVerifyView(APIView):
    """Step 2 of login: exchange mfa_token + TOTP code for full JWT pair."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mfa_token_str = serializer.validated_data["mfa_token"]
        otp_code = serializer.validated_data["otp_code"]

        try:
            token = AccessToken(mfa_token_str)
        except TokenError:
            return Response({"detail": "MFA session expired or invalid. Please log in again."},
                             status=status.HTTP_401_UNAUTHORIZED)

        if token.get("scope") != "mfa_pending":
            return Response({"detail": "Invalid token scope."}, status=status.HTTP_401_UNAUTHORIZED)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=token["user_id"])

        # django_otp integration point: replace with real TOTP device check, e.g.
        #   from django_otp.plugins.otp_totp.models import TOTPDevice
        #   device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        #   if not device or not device.verify_token(otp_code): return 401
        if not _verify_totp_stub(user, otp_code):
            return Response({"detail": "Invalid MFA code."}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(_issue_tokens(user), status=status.HTTP_200_OK)


def _verify_totp_stub(user, otp_code: str) -> bool:
    """
    Placeholder verification. Swap for django_otp's TOTPDevice.verify_token
    once the MFA enrollment flow (QR-code provisioning) is implemented.
    """
    return len(otp_code) == 6 and otp_code.isdigit()


class FacultySignUpSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    employee_id = serializers.CharField(max_length=32)
    department = serializers.CharField(max_length=100)
    role = serializers.ChoiceField(choices=Faculty.Role.choices, default=Faculty.Role.MODERATOR)

    def validate_username(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def validate_employee_id(self, value):
        if Faculty.objects.filter(employee_id__iexact=value).exists():
            raise serializers.ValidationError("A faculty member with this Employee ID already exists.")
        return value

    def create(self, validated_data):
        from django.contrib.auth import get_user_model
        from django.db import transaction
        User = get_user_model()
        
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data["username"],
                email=validated_data["email"],
                password=validated_data["password"],
                first_name=validated_data.get("first_name", ""),
                last_name=validated_data.get("last_name", ""),
            )
            faculty = Faculty.objects.create(
                user=user,
                employee_id=validated_data["employee_id"],
                department=validated_data["department"],
                role=validated_data.get("role", Faculty.Role.MODERATOR),
                mfa_enabled=False
            )
        return faculty


class FacultySignUpView(APIView):
    """Faculty registration endpoint."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FacultySignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        faculty = serializer.save()
        user = faculty.user
        
        tokens = _issue_tokens(user)
        return Response(
            {
                "message": "Registration successful.",
                "mfa_required": False,
                **tokens
            },
            status=status.HTTP_201_CREATED,
        )
