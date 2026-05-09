from django.db import models

class Food(models.Model):
    CATEGORY_CHOICES = [
        ('boxmeals', 'Box Meals'),
        ('varietybuckets', 'Variety Buckets'),
        ('veg', 'Veg'),
        ('burgers', 'Burgers'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.FloatField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    image = models.ImageField(upload_to='food/')

    def __str__(self):
        return self.name