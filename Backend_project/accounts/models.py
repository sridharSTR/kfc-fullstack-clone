from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import check_password, make_password
from datetime import timedelta
import secrets


class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        user = self.model(
            username=username,
            email=email
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None):
        user = self.create_user(username, email, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class CustomUser(AbstractUser):
    class AdminRequestStatus(models.TextChoices):
        NONE = "none", "No request"
        PENDING = "pending", "Pending approval"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=True)
    admin_request_status = models.CharField(
        max_length=20,
        choices=AdminRequestStatus.choices,
        default=AdminRequestStatus.NONE,
    )
    admin_requested_at = models.DateTimeField(null=True, blank=True)
    admin_approved_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = CustomUserManager()


class AdminLoginOTP(models.Model):
    admin = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="admin_login_otps",
    )
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["admin", "is_used", "expires_at"]),
        ]

    @classmethod
    def create_for_admin(cls, admin):
        code = f"{secrets.randbelow(1000000):06d}"
        otp = cls.objects.create(
            admin=admin,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=5),
        )
        return otp, code

    @classmethod
    def create_for_user(cls, user):
        return cls.create_for_admin(user)

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    def verify(self, code):
        self.attempts += 1
        self.save(update_fields=["attempts"])

        if self.is_used or self.is_expired or self.attempts > 5:
            return False

        return check_password(code, self.code_hash)
