from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.core.mail import EmailMessage
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.conf import settings
import smtplib

from cart.models import CartItem
from .models import Order, OrderItem
from .serializers import OrderSerializer


def _pdf_escape(value):
    return str(value).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _money(value):
    return f"{float(value):.2f}"


def _chunk_text(value, max_length):
    text = str(value)
    chunks = []

    while len(text) > max_length:
        split_at = text.rfind(" ", 0, max_length)
        if split_at <= 0:
            split_at = max_length
        chunks.append(text[:split_at].strip())
        text = text[split_at:].strip()

    if text:
        chunks.append(text)

    return chunks or [""]


def build_order_pdf(order):
    order = (
        Order.objects
        .select_related("user")
        .prefetch_related("items__food")
        .get(pk=order.pk)
    )

    commands = []

    def text(x, y, value, size=10, font="F1"):
        commands.extend([
            "BT",
            f"/{font} {size} Tf",
            f"{x} {y} Td",
            f"({_pdf_escape(value)}) Tj",
            "ET",
        ])

    def line(x1, y1, x2, y2):
        commands.append(f"{x1} {y1} m {x2} {y2} l S")

    def rect(x, y, width, height):
        commands.append(f"{x} {y} {width} {height} re S")

    def filled_rect(x, y, width, height, gray="0.94"):
        commands.append(f"{gray} g {x} {y} {width} {height} re f 0 g")

    commands.extend(["0.85 w", "0 g"])
    filled_rect(40, 720, 532, 48, "0.10")
    text(58, 748, "KFC", 20, "F2")
    text(58, 730, "Professional Order Bill / Tax Invoice", 12, "F2")
    text(420, 748, f"Invoice: KFC-{order.id:05d}", 11, "F2")
    text(420, 730, f"Date: {order.created_at.strftime('%d %b %Y, %I:%M %p')}", 9)

    rect(40, 604, 255, 96)
    rect(317, 604, 255, 96)
    text(54, 681, "BILL TO", 11, "F2")
    text(54, 662, order.customer_name, 10, "F2")
    text(54, 646, order.customer_email, 9)
    text(54, 630, f"Phone: {order.phone}", 9)

    address_y = 614
    for address_line in _chunk_text(order.delivery_address, 42)[:2]:
        text(54, address_y, address_line, 9)
        address_y -= 13

    text(331, 681, "ORDER SUMMARY", 11, "F2")
    text(331, 662, f"Order Status: {order.get_status_display()}", 10)
    text(331, 646, f"Payment Method: {order.get_payment_method_display()}", 10)
    text(331, 630, f"Payment Status: {order.get_payment_status_display()}", 10)
    text(331, 614, "Receipt sent by email with PDF attachment", 9)

    table_top = 574
    filled_rect(40, table_top, 532, 24, "0.90")
    rect(40, 214, 532, 384)
    text(54, table_top + 8, "Item", 10, "F2")
    text(348, table_top + 8, "Qty", 10, "F2")
    text(404, table_top + 8, "Rate", 10, "F2")
    text(492, table_top + 8, "Amount", 10, "F2")
    line(40, table_top, 572, table_top)
    line(335, 214, 335, 598)
    line(390, 214, 390, 598)
    line(475, 214, 475, 598)

    y = 548
    for item in order.items.all():
        name = item.food.name if item.food else "Deleted Item"
        text(54, y, name[:44], 10)
        text(354, y, item.quantity, 10)
        text(404, y, f"INR {_money(item.price)}", 10)
        text(492, y, f"INR {_money(item.get_total_price())}", 10, "F2")
        line(40, y - 10, 572, y - 10)
        y -= 24
        if y < 238:
            break

    filled_rect(335, 140, 237, 50, "0.95")
    rect(335, 140, 237, 50)
    text(354, 171, "Grand Total", 12, "F2")
    text(470, 171, f"INR {_money(order.total_price)}", 12, "F2")
    text(354, 152, "Taxes included where applicable", 8)

    rect(40, 126, 260, 64)
    text(54, 171, "TRACKING", 10, "F2")
    text(54, 153, "Placed -> Confirmed -> Preparing", 8)
    text(54, 139, "Out for delivery -> Delivered", 8)

    filled_rect(40, 72, 532, 36, "0.96")
    text(54, 92, "Congratulations! Your KFC order has been placed successfully.", 11, "F2")
    text(54, 78, "Thank you for ordering with us. Please keep this bill for your records.", 8)

    content = "\n".join(commands).encode("latin-1", errors="replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        b"<< /Length " + str(len(content)).encode("ascii") + b" >>\nstream\n" + content + b"\nendstream",
    ]

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for number, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{number} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_at = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(
        f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_at}\n%%EOF\n".encode("ascii")
    )
    return bytes(pdf)


def send_order_receipt(order):
    if not order.customer_email:
        return False, "No receipt email address was provided."

    pdf = build_order_pdf(order)
    email = EmailMessage(
        subject=f"Congratulations! Your KFC order #{order.id} is confirmed",
        body=(
            f"Hi {order.customer_name},\n\n"
            "Congratulations! Your KFC order has been placed successfully.\n\n"
            f"Order ID: #{order.id}\n"
            f"Delivery Address: {order.delivery_address}\n"
            f"Total Bill: INR {order.total_price}\n\n"
            "Your detailed PDF bill receipt is attached with this email.\n"
            "Thank you for ordering with us."
        ),
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=[order.customer_email],
    )
    email.attach(f"order-{order.id}-receipt.pdf", pdf, "application/pdf")
    try:
        sent_count = email.send(fail_silently=False)
    except (smtplib.SMTPException, OSError) as error:
        return False, str(error)

    if sent_count:
        return True, ""

    return False, "Email provider did not accept the message."


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer_name = (request.data.get("name") or "").strip()
        phone = (request.data.get("phone") or "").strip()
        delivery_address = (request.data.get("address") or "").strip()
        customer_email = (request.data.get("email") or request.user.email or "").strip()
        payment_method = (request.data.get("payment_method") or Order.PaymentMethod.CASH).strip()

        if not customer_name or not phone or not delivery_address or not customer_email:
            return Response({"error": "Name, email, phone, and address are required"}, status=400)

        try:
            validate_email(customer_email)
        except ValidationError:
            return Response({"error": "Enter a valid email address"}, status=400)

        if not phone.isdigit() or len(phone) != 10:
            return Response({"error": "Enter valid 10-digit phone number"}, status=400)

        payment_methods = {choice[0] for choice in Order.PaymentMethod.choices}
        if payment_method not in payment_methods:
            return Response({"error": "Select a valid payment method"}, status=400)

        payment_status = (
            Order.PaymentStatus.PENDING
            if payment_method == Order.PaymentMethod.CASH
            else Order.PaymentStatus.PAID
        )

        cart_items = (
            CartItem.objects
            .filter(user=request.user)
            .select_related("food")
        )

        if not cart_items.exists():
            return Response({"error": "Cart empty"}, status=400)

        total = sum(i.food.price * i.quantity for i in cart_items)

        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                customer_name=customer_name,
                customer_email=customer_email,
                phone=phone,
                delivery_address=delivery_address,
                payment_method=payment_method,
                payment_status=payment_status,
                total_price=total
            )

            OrderItem.objects.bulk_create([
                OrderItem(
                    order=order,
                    food=i.food,
                    price=i.food.price,
                    quantity=i.quantity
                )
                for i in cart_items
            ])

            cart_items.delete()

        email_sent, email_error = send_order_receipt(order)

        response_data = {
            "message": "Order placed",
            "order_id": order.id,
            "email": order.customer_email,
            "email_sent": email_sent,
        }
        if email_error and settings.DEBUG:
            response_data["email_error"] = email_error

        return Response(response_data)


class OrderHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects
            .filter(user=request.user)
            .prefetch_related("items__food")
        )
        serializer = OrderSerializer(
            orders,
            many=True,
            context={"request": request},
        )
        return Response({"orders": serializer.data})


class AdminOrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = (
            Order.objects
            .select_related("user")
            .prefetch_related("items__food")
        )
        serializer = OrderSerializer(
            orders,
            many=True,
            context={"request": request},
        )
        return Response({
            "orders": serializer.data,
            "statuses": [
                {"value": value, "label": label}
                for value, label in Order.Status.choices
            ],
        })


class AdminOrderStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        status_value = request.data.get("status")
        statuses = {choice[0] for choice in Order.Status.choices}

        if status_value not in statuses:
            return Response({"error": "Select a valid order status"}, status=400)

        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)

        order.status = status_value
        if status_value == Order.Status.DELIVERED:
            order.payment_status = Order.PaymentStatus.PAID
        order.save(update_fields=["status", "payment_status"])

        serializer = OrderSerializer(order, context={"request": request})
        return Response(serializer.data)
