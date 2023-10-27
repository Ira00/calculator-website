from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    project_id = models.CharField(primary_key=True, max_length=255, verbose_name='Ідентифікатор проекту')
    time_create = models.DateTimeField(auto_now_add=True, verbose_name='Час створення')
    author = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    cost_PDV = models.CharField(max_length=255, verbose_name='Вартість рейсу з ПДВ (вручну)', null=True)
    count_trip = models.CharField(max_length=255, verbose_name='Кількість рейсів', null=True)
    delivery_where = models.CharField(max_length=255, verbose_name='Доставка окремо/в ціні')
    distance = models.CharField(max_length=255, verbose_name='Відстань, км', null=True)
    tn_per_trip = models.CharField(max_length=255, verbose_name='ТН/рейс', null=True)
    is_delivery = models.CharField(max_length=255, verbose_name='З/Без доставка')
    guide_option = models.CharField(max_length=255, verbose_name='Реквізити', null=True)


class Product(models.Model):
    title = models.CharField(max_length=255, verbose_name='Назва')
    article = models.IntegerField(verbose_name='Артикул')
    count = models.IntegerField(verbose_name='Кількість')
    discount = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Знижка', null=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, related_name='products')



    def __str__(self):
        return f"{self.title}"

