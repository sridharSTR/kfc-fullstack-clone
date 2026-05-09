from rest_framework import serializers
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    requested_role = serializers.ChoiceField(
        choices=["customer", "admin"],
        write_only=True,
        required=False,
        default="customer",
    )

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password2', 'requested_role']

    def validate(self, data):
        if not data.get('username') or not data.get('email'):
            raise serializers.ValidationError("All fields required")

        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match")

        if CustomUser.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Email already exists")

        if CustomUser.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError("Username already exists")

        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        requested_role = validated_data.pop('requested_role', 'customer')

        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        user.is_active = False
        user.is_email_verified = False

        if requested_role == "admin":
            from django.utils import timezone

            user.admin_request_status = CustomUser.AdminRequestStatus.PENDING
            user.admin_requested_at = timezone.now()
            user.save(update_fields=[
                "is_active",
                "is_email_verified",
                "admin_request_status",
                "admin_requested_at",
            ])
        else:
            user.save(update_fields=["is_active", "is_email_verified"])

        return user


class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    requested_role = serializers.ChoiceField(
        choices=["customer", "admin"],
        required=False,
        default="customer",
    )


class AdminOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)
    requested_role = serializers.ChoiceField(
        choices=["customer", "admin"],
        required=False,
        default="customer",
    )


class RegistrationOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)
