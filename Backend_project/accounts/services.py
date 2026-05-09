from django.core.mail import send_mail
from django.conf import settings


def send_admin_otp_email(admin, code):
    return send_login_otp_email(admin, code)


def send_login_otp_email(user, code):
    subject = "Your KFC Login OTP"
    message = (
        f"Hi {user.username},\n\n"
        f"Your KFC login OTP is {code}.\n"
        "This code expires in 5 minutes.\n\n"
        "If you did not request this login, please secure your account."
    )
    return send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
