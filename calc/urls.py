from django.urls import path, include
from .views import *

urlpatterns = [
    path('', index, name='index'),
    path('<str:project_id>/', index, name='index_project_id'),
    path('delete_project/<str:project_id>/', delete_project, name='delete_project'),
    path('delete_product/<int:product_pk>/', delete_product, name='delete_product'),
    path('personal_cabinet/<str:pk>/', personal_cabinet, name='personal_cabinet'),
    path("login", login_view, name="login"),
    path("logout", logout_view, name="logout"),
    path("register", register, name="register"),
]