from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from django.core.exceptions import ValidationError
import smtplib

from food.models import Food
from orders.models import Order
from orders.serializers import OrderSerializer
from .models import AdminLoginOTP
from .permissions import IsAdminUserOnly, IsSuperUserOnly
from .serializers import (
    AdminLoginSerializer,
    AdminOTPVerifySerializer,
    RegisterSerializer,
    RegistrationOTPVerifySerializer,
)
from .services import send_login_otp_email

User = get_user_model()


def serializer_error_message(errors):
    if isinstance(errors, dict):
        messages = []
        for field, field_errors in errors.items():
            if isinstance(field_errors, (list, tuple)):
                joined = " ".join(str(error) for error in field_errors)
            else:
                joined = str(field_errors)

            if field == "non_field_errors":
                messages.append(joined)
            else:
                messages.append(f"{field}: {joined}")

        return " ".join(messages)

    return str(errors)


def get_user_payload(user):
    return {
        "username": user.username,
        "email": user.email,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_email_verified": user.is_email_verified,
        "role": "admin" if user.is_staff else "customer",
        "admin_request_status": user.admin_request_status,
    }


def send_login_otp_response(user):
    AdminLoginOTP.objects.filter(
        admin=user,
        is_used=False,
        expires_at__gt=timezone.now(),
    ).update(is_used=True)

    otp, code = AdminLoginOTP.create_for_user(user)

    try:
        send_login_otp_email(user, code)
    except (smtplib.SMTPException, OSError) as error:
        otp.delete()
        return Response({"error": f"Unable to send OTP email: {error}"}, status=502)

    return Response({
        "status": "otp_required",
        "message": "OTP sent to your email",
        "email": user.email,
        "expires_in_seconds": 300,
    })


# REGISTER
class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": serializer_error_message(serializer.errors)}, status=400)

        user = serializer.save()
        otp_response = send_login_otp_response(user)
        if otp_response.status_code >= 400:
            user.delete()
            return otp_response

        message = "User created. Verify your email OTP before login."
        if user.admin_request_status == User.AdminRequestStatus.PENDING:
            message = "User created. Verify your email OTP before login. Admin access is pending superuser approval."

        return Response({
            "message": message,
            "admin_request_status": user.admin_request_status,
            "email": user.email,
            "status": "registration_otp_required",
        }, status=201)


class VerifyRegistrationOTPView(APIView):
    def post(self, request):
        serializer = RegistrationOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        otp_code = serializer.validated_data["otp"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Account not found"}, status=404)

        if user.is_email_verified:
            return Response({"message": "Email already verified"})

        otp = (
            AdminLoginOTP.objects
            .filter(admin=user, is_used=False)
            .order_by("-created_at")
            .first()
        )

        if not otp or not otp.verify(otp_code):
            return Response({"error": "Invalid or expired OTP"}, status=400)

        otp.is_used = True
        otp.save(update_fields=["is_used"])
        user.is_email_verified = True
        user.is_active = True
        user.save(update_fields=["is_email_verified", "is_active"])

        return Response({
            "status": "success",
            "message": "Email verified. You can now login.",
            "admin_request_status": user.admin_request_status,
        })


# LOGIN (EMAIL BASED)
class LoginView(APIView):
    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]
        requested_role = serializer.validated_data["requested_role"]

        if not email or not password:
            return Response({"error": "Email and password required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=400)

        if not user.check_password(password):
            return Response({"error": "Wrong password"}, status=400)

        if not user.is_active or not user.is_email_verified:
            return Response({"error": "Verify your email OTP before login"}, status=403)

        if requested_role == "admin" and not user.is_staff:
            if user.admin_request_status == User.AdminRequestStatus.PENDING:
                return Response({"error": "Admin access is pending superuser approval"}, status=403)

            return Response({"error": "Admin access is not approved for this account"}, status=403)

        return send_login_otp_response(user)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response({
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "is_email_verified": user.is_email_verified,
            "role": "admin" if user.is_staff else "customer",
            "admin_request_status": user.admin_request_status,
        })


class RequestAdminAccessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.is_superuser or user.is_staff:
            return Response({"error": "This account already has admin access"}, status=400)

        if user.admin_request_status == User.AdminRequestStatus.PENDING:
            return Response({"error": "Admin access request is already pending"}, status=400)

        user.admin_request_status = User.AdminRequestStatus.PENDING
        user.admin_requested_at = timezone.now()
        user.save(update_fields=["admin_request_status", "admin_requested_at"])

        return Response({
            "message": "Admin access request sent for superuser approval",
            "user": get_user_payload(user),
        })


class AdminLoginView(APIView):
    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid admin credentials"}, status=400)

        if not user.is_staff:
            return Response({"error": "Only admins can use this login"}, status=403)

        if not user.check_password(password):
            return Response({"error": "Invalid admin credentials"}, status=400)

        if not user.is_active or not user.is_email_verified:
            return Response({"error": "Verify your email OTP before login"}, status=403)

        return send_login_otp_response(user)


class AdminVerifyOTPView(APIView):
    def post(self, request):
        serializer = AdminOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        otp_code = serializer.validated_data["otp"]
        requested_role = serializer.validated_data.get("requested_role", "customer")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Account not found"}, status=404)

        if requested_role == "admin" and not user.is_staff:
            return Response({"error": "Admin access is not approved for this account"}, status=403)

        if not user.is_active or not user.is_email_verified:
            return Response({"error": "Verify your email OTP before login"}, status=403)

        otp = (
            AdminLoginOTP.objects
            .filter(admin=user, is_used=False)
            .order_by("-created_at")
            .first()
        )

        if not otp or not otp.verify(otp_code):
            return Response({"error": "Invalid or expired OTP"}, status=400)

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        refresh = RefreshToken.for_user(user)

        return Response({
            "status": "success",
            "data": {
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                "user": {
                    **get_user_payload(user),
                },
            },
        })


class PendingAdminRequestsView(APIView):
    permission_classes = [IsSuperUserOnly]

    def get(self, request):
        pending_users = User.objects.filter(
            admin_request_status=User.AdminRequestStatus.PENDING,
            is_staff=False,
        ).order_by("admin_requested_at")

        return Response({
            "requests": [
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "admin_requested_at": user.admin_requested_at,
                }
                for user in pending_users
            ]
        })


class ApproveAdminRequestView(APIView):
    permission_classes = [IsSuperUserOnly]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if user.is_superuser:
            return Response({"error": "Superuser accounts do not need approval"}, status=400)

        user.is_staff = True
        user.admin_request_status = User.AdminRequestStatus.APPROVED
        user.admin_approved_at = timezone.now()
        user.save(update_fields=["is_staff", "admin_request_status", "admin_approved_at"])

        return Response({
            "message": "Admin access approved",
            "user": get_user_payload(user),
        })


class RejectAdminRequestView(APIView):
    permission_classes = [IsSuperUserOnly]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if user.is_superuser:
            return Response({"error": "Superuser accounts cannot be rejected"}, status=400)

        user.is_staff = False
        user.admin_request_status = User.AdminRequestStatus.REJECTED
        user.save(update_fields=["is_staff", "admin_request_status"])

        return Response({
            "message": "Admin access rejected",
            "user": get_user_payload(user),
        })


class RevokeAdminAccessView(APIView):
    permission_classes = [IsSuperUserOnly]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if user.is_superuser:
            return Response({"error": "Superuser admin access cannot be revoked"}, status=400)

        user.is_staff = False
        user.admin_request_status = User.AdminRequestStatus.NONE
        user.admin_approved_at = None
        user.save(update_fields=["is_staff", "admin_request_status", "admin_approved_at"])

        return Response({
            "message": "Admin access revoked",
            "user": get_user_payload(user),
        })


class AdminUsersView(APIView):
    permission_classes = [IsSuperUserOnly]

    def get(self, request):
        users = User.objects.order_by("-date_joined")

        return Response({
            "users": [
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": "admin" if user.is_staff else "customer",
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                    "is_active": user.is_active,
                    "is_email_verified": user.is_email_verified,
                    "admin_request_status": user.admin_request_status,
                    "admin_requested_at": user.admin_requested_at,
                    "joined": user.date_joined,
                }
                for user in users
            ]
        })


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUserOnly]

    def get(self, request):
        orders = Order.objects.prefetch_related("items__food").select_related("user")
        total_sales = orders.aggregate(total=Sum("total_price"))["total"] or 0
        pending_orders = orders.filter(status__in=[
            Order.Status.PLACED,
            Order.Status.CONFIRMED,
            Order.Status.PREPARING,
            Order.Status.OUT_FOR_DELIVERY,
        ]).count()

        recent_orders = orders[:8]
        users = User.objects.order_by("-date_joined")[:8]
        foods = Food.objects.order_by("name")[:8]

        return Response({
            "cards": {
                "total_users": User.objects.count(),
                "total_orders": orders.count(),
                "total_foods": Food.objects.count(),
                "total_sales": total_sales,
                "pending_orders": pending_orders,
            },
            "recent_orders": OrderSerializer(
                recent_orders,
                many=True,
                context={"request": request},
            ).data,
            "users": [
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": "admin" if user.is_staff else "customer",
                    "admin_request_status": user.admin_request_status,
                    "is_active": user.is_active,
                    "joined": user.date_joined,
                }
                for user in users
            ],
            "foods": [
                {
                    "id": food.id,
                    "name": food.name,
                    "description": food.description,
                    "category": food.category,
                    "price": food.price,
                    "image": request.build_absolute_uri(food.image.url) if food.image else "",
                }
                for food in foods
            ],
            "payments": {
                "paid": orders.filter(payment_status=Order.PaymentStatus.PAID).count(),
                "pending": orders.filter(payment_status=Order.PaymentStatus.PENDING).count(),
                "cash": orders.filter(payment_method=Order.PaymentMethod.CASH).count(),
                "upi": orders.filter(payment_method=Order.PaymentMethod.UPI).count(),
                "card": orders.filter(payment_method=Order.PaymentMethod.CARD).count(),
            },
        })
