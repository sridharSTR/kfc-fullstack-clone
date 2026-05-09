from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_adminloginotp"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="admin_approved_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="customuser",
            name="admin_request_status",
            field=models.CharField(
                choices=[
                    ("none", "No request"),
                    ("pending", "Pending approval"),
                    ("approved", "Approved"),
                    ("rejected", "Rejected"),
                ],
                default="none",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="customuser",
            name="admin_requested_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
