from datetime import datetime
from django.utils import timezone
from django.shortcuts import render, get_object_or_404
import pandas as pd
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.db import IntegrityError
from calc.models import Product, Project
from itertools import groupby
import json
from django.http import JsonResponse
from io import BytesIO
# from reportlab.pdfgen import canvas
from django.http import FileResponse
# from bs4 import BeautifulSoup
import pytz
import gspread
import pandas as pd
import os
import uuid
# Create your views here.

def generate_project_id():
    return str(uuid.uuid4())

def index(request, project_id=None):
    if not request.user.is_authenticated:
        return redirect("login")
    # Google Sheets
    # current_dir = os.path.dirname(__file__)
    # file_path = os.path.join(current_dir, 'service_account.json')
    # print('start_db')
    # sa = gspread.service_account(filename=file_path)
    # print(sa.openall())
    #
    # wks_all_products = sa.open('Залізобетон').sheet1
    # all_products = wks_all_products.get_all_values()[1:]
    # headers_all_products = all_products.pop(0)
    # # print(headers_all_products)
    # df_all_products = pd.DataFrame(all_products, columns=headers_all_products)
    # df_all_products = df_all_products[['Артикул', 'Маса (т)', 'Найменування']]
    # # print(df_all_products.head())
    #
    # wks_prices = sa.open('20_Прайс_ЗБВ').sheet1
    # prices = wks_prices.get_all_values()[1:]
    # headers_prices = prices.pop(0)
    # # print(headers_prices)
    # df_prices = pd.DataFrame(prices, columns=headers_prices)
    # df_prices = df_prices[['Артикул', 'ГРН \n (з ПДВ)']]
    # # print(df_prices.head())
    # merged_df = pd.merge(df_all_products, df_prices, on='Артикул', how='left')
    # merged_df = merged_df.fillna(0)
    # End Google Sheets

    db = {

        'ПК 44-12-8': {
            'article': 10000347,
            'weight': 1.6,
            'price': 3428
        },
        'ПК 44-10-8': {
            'article': 10000345,
            'weight': 1.36,
            'price': 4428.50
        }
    }
    guide = {}
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, 'Довідник.xlsx')
    df_guide = pd.read_excel(file_path)
    df_guide = df_guide[df_guide['Організація'].notna()]
    df_guide = df_guide.loc[:, 'Організація':]
    for index, row in df_guide.iterrows():
        item_infornation = {
            'receiver': row['Отримувач'],
            'code': row['Код'] if str(row['Код']) == "nan" else str(row['Код'])[:str(row['Код']).find('.')],
            'bank': row['Банк отримувача'],
            'account': row['Кредит рахунок'],
            'details': row['Реквізити'],
            'address': row['Адреса'],
            'edrpou': row['Код за ЄДРПОУ'],
        }
        guide[row['Організація']] = item_infornation

    context = {
        'db': db,
        'product_options': list(db.keys()),
        'guide': guide,
        'guide_options': list(guide.keys()),
        'deliveryWhere': 'deliveryIn',
        'isDelivery': 'deliveryWithout',
    }

    if request.method == 'POST':
        main_settings = json.loads(request.POST.get('mainSettings'))
        try:
            products_data = json.loads(request.POST.get('products'))

            project_id_local = generate_project_id()
            project = Project()
            project.project_id = project_id_local
            project.author_id = request.user.pk
            project.time_create = timezone.now()
            project.cost_PDV = main_settings['costPDV'] if main_settings else ''
            project.count_trip = main_settings['countTrip'] if main_settings else ''
            project.delivery_where = main_settings['deliveryWhere'] if 'deliveryWhere' in main_settings else 'deliveryIn'
            project.distance = main_settings['distance'] if main_settings else ''
            project.tn_per_trip = main_settings['tn_per_trip'] if main_settings else ''
            project.is_delivery = main_settings['isDelivery'] if 'isDelivery' in main_settings else 'deliveryWithout'
            project.guide_option = main_settings['guideOption'] if main_settings else ''
            project.save()
            for product_data in products_data:
                if product_data:
                    # Product doesn't exist, create it
                    product = Product()
                    product.title = product_data['title']
                    product.count = product_data['count']
                    if product_data['discount']:
                        product.discount = product_data['discount'].replace(',', '.')
                    else:
                        product.discount = 0
                    product.article = db[product_data['title']]['article']
                    product.project = project
                    product.save()

            context["products"] = Product.objects.select_related('project').filter(project_id=project_id_local)
            response_data = {
                'redirect_url': reverse('index_project_id', kwargs={'project_id': project_id_local}),
                #'mainSettings': main_settings_json,
            }
            main_settings_json = json.dumps(main_settings)
            response = JsonResponse(response_data)
            response.set_cookie('mainSettings', main_settings_json)

            return response
        except (ValueError, Product.DoesNotExist) as e:
            return JsonResponse({'success': False, 'error': str(e)})
    else:
        if project_id and project_id != 'favicon.ico':
            context["products"] = Product.objects.select_related('project').filter(project_id=project_id)
            context["project"] = Project.objects.get(project_id=project_id)
        return render(request, 'calc/index.html', context=context)

        # return render(request, 'calc/index.html', context=context)

def login_view(request):
    if request.method == "POST":
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "calc/login.html", {
                "message": "Неправильне ім'я користувача та/або пароль."
            })
    else:
        return render(request, "calc/login.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        first_name = request.POST['first_name']
        last_name = request.POST['last_name']

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "calc/register.html", {
                "message": "Паролі повинні збігатися."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.first_name = first_name
            user.last_name = last_name
            user.save()
        except IntegrityError:
            return render(request, "calc/register.html", {
                "message": "Ім'я користувача вже зайнято."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "calc/register.html")

def personal_cabinet(request, pk):

    db = {

        'ПК 44-12-8': {
            'article': 10000347,
            'weight': 1.6,
            'price': 3428
        },
        'ПК 44-10-8': {
            'article': 10000345,
            'weight': 1.36,
            'price': 4428.50
        }
    }
    # projects = Product.objects.filter(author_id=pk).order_by('-project__time_create')
    projects = Product.objects.select_related('project').filter(project__author_id=pk).order_by('-project__time_create')
    # Групуємо проекти за project_id
    grouped_projects = {}
    for project_id, group in groupby(projects, lambda x: x.project_id):
        grouped_projects[project_id] = list(group)

    context = {'grouped_projects': grouped_projects,

               'db': db}
    return render(request, 'calc/personal_cabinet.html', context=context)

def delete_product(request, product_pk, project_id):
    product = get_object_or_404(Product, pk=product_pk)
    product.delete()
    return redirect('index_project_id', project_id=project_id)

def delete_project(request, project_id):
    projects = Project.objects.filter(project_id=project_id)
    projects.delete()
    return redirect('personal_cabinet', pk=request.user.pk)

def pdf(request):
    return render(request, 'calc/pdf.html')

def edit_products(request):
    pass


