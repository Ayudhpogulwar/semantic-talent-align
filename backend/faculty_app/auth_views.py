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
    username_or_email = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    employee_id = serializers.CharField(required=False, allow_blank=True)
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
    if hasattr(user, "faculty") and user.faculty:
        faculty_role = user.faculty.role
    elif hasattr(user, "faculty_profile") and user.faculty_profile:
        faculty_role = user.faculty_profile.role
    access_token["role"] = faculty_role

    return {
        "access": str(access_token),
        "refresh": str(refresh),
        "user": {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name or user.username,
            "last_name": user.last_name or "",
            "role": faculty_role
        }
    }


class FacultyLoginView(APIView):
    """Step 1 of login: password check (supporting Username or @fac.gh Email), then branch on MFA status."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = (
            serializer.validated_data.get("username_or_email") or
            serializer.validated_data.get("email") or
            serializer.validated_data.get("employee_id") or ""
        ).strip()
        password = serializer.validated_data["password"]

        if not identifier:
            return Response({"detail": "Username or Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Domain Validation Check: If an email address is supplied, it MUST end with @fac.gh
        if "@" in identifier and not identifier.lower().endswith("@fac.gh"):
            return Response(
                {"error": "Faculty access requires a valid @fac.gh institutional email address."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Block student accounts from Faculty Portal login
        from api.db_helper import get_db
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT role FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)", (identifier, identifier))
            row = cursor.fetchone()
            conn.close()
            if row and dict(row).get("role") == "Student":
                return Response(
                    {"error": "Faculty access requires a valid @fac.gh institutional email address."},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception:
            pass

        from django.db.models import Q
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # 1. Try finding existing Faculty by username, email, or employee_id
        faculty = Faculty.objects.select_related("user").filter(
            Q(user__email__iexact=identifier) |
            Q(user__username__iexact=identifier) |
            Q(employee_id__iexact=identifier)
        ).first()

        if faculty:
            user = authenticate(request, username=faculty.user.username, password=password)
            if user is None:
                if not faculty.user.check_password(password):
                    return Response({"detail": "Invalid password."}, status=status.HTTP_401_UNAUTHORIZED)
                user = faculty.user
        else:
            # 2. Check if Django User exists by username or email
            user = User.objects.filter(
                Q(username__iexact=identifier) | Q(email__iexact=identifier)
            ).first()

            if user:
                if getattr(user, "role", None) == "Student":
                    return Response(
                        {"error": "Faculty access requires a valid @fac.gh institutional email address."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                if not user.check_password(password):
                    return Response({"detail": "Invalid password."}, status=status.HTTP_401_UNAUTHORIZED)
                faculty, _ = Faculty.objects.get_or_create(
                    user=user,
                    defaults={
                        "employee_id": f"EMP-{user.id}",
                        "department": "Computer Science & Engineering",
                        "role": Faculty.Role.MODERATOR
                    }
                )
            else:
                # 3. Provision Faculty user for demo accounts or @fac.gh emails
                username = identifier.split("@")[0] if "@" in identifier else identifier
                email_addr = identifier if "@" in identifier else f"{username.lower()}@fac.gh"
                user = User.objects.create_user(
                    username=username,
                    email=email_addr,
                    password=password,
                    first_name=username.capitalize(),
                    last_name="Faculty"
                )
                faculty = Faculty.objects.create(
                    user=user,
                    employee_id=f"FAC-{user.id}",
                    department="Computer Science & Engineering",
                    role=Faculty.Role.MODERATOR,
                    mfa_enabled=False
                )

        if faculty.mfa_enabled:
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
        email_val = value.strip().lower()
        if not email_val.endswith("@fac.gh"):
            raise serializers.ValidationError("Faculty access requires a valid @fac.gh institutional email address.")
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email__iexact=email_val).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return email_val

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
        email = request.data.get("email", "").strip().lower()
        if not email.endswith("@fac.gh"):
            return Response(
                {"error": "Faculty access requires a valid @fac.gh institutional email address."},
                status=status.HTTP_403_FORBIDDEN
            )

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
