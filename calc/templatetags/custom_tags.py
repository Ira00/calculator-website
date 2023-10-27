from django import template

register = template.Library()

@register.filter
def replace_coma(value):
    return str(value).replace(",",".")

@register.simple_tag
def get_nested_value(my_dict, *args):
    try:
        for key in args:
            my_dict = my_dict[key]

        return my_dict
    except (KeyError, TypeError):
        return None

@register.simple_tag
def get_sum_with_discount(price, discount):
    discount = float(discount)
    return round(price - (price * discount / 100), 2)


@register.filter
def format_currency(amount):
    return "{:,.2f}".format(float(amount)).replace(',', ' ')

@register.filter
def format_date(value):
    months = {
        '01': 'січня',
        '02': 'лютого',
        '03': 'березня',
        '04': 'квітня',
        '05': 'травня',
        '06': 'червня',
        '07': 'липня',
        '08': 'серпня',
        '09': 'вересня',
        '10': 'жовтня',
        '11': 'листопада',
        '12': 'грудня'
    }
    return months[value]
