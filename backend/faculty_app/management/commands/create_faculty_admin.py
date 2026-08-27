from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from faculty_app.models import Faculty

User = get_user_model()


class Command(BaseCommand):
    help = "Creates a Django superuser mapped to a Faculty admin profile."

    def add_arguments(self, parser):
        parser.add_argument("--username", type=str, required=True, help="Username for the login user.")
        parser.add_argument("--email", type=str, required=True, help="Email address.")
        parser.add_argument("--password", type=str, required=True, help="Login password.")
        parser.add_argument("--employee-id", type=str, required=True, help="Unique employee code.")
        parser.add_argument("--department", type=str, required=True, help="Assigned university department.")
        parser.add_argument(
            "--role",
            type=str,
            default="SUPER_ADMIN",
            choices=["MODERATOR", "PLACEMENT_OFFICER", "DEPARTMENT_ADMIN", "SUPER_ADMIN"],
            help="Designated role level (default SUPER_ADMIN).",
        )

    def handle(self, *args, **options):
        username = options["username"]
        email = options["email"]
        password = options["password"]
        employee_id = options["employee_id"]
        department = options["department"]
        role = options["role"]

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.ERROR(f"User with username '{username}' already exists."))
            return

        if Faculty.objects.filter(employee_id=employee_id).exists():
            self.stdout.write(self.style.ERROR(f"Faculty with employee_id '{employee_id}' already exists."))
            return

        # Create Core User
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name="Admin",
            last_name="Account",
        )

        # Create Mapped Faculty profile
        Faculty.objects.create(
            user=user,
            employee_id=employee_id,
            department=department,
            role=role,
            mfa_enabled=False,
            is_active=True,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created Faculty user '{username}' and profile associated with Employee ID '{employee_id}' (Role: {role})."
            )
        )
