$(document).ready(function() {
    $('#selectTitle').select2();
    // $('#productsTable').DataTable({
    //     "scrollX": true
    //   });
    // Function to add a new product row
    function addProductRow() {
        var newRow = `
            <tr data-pk="">
                <td></td>
                <td></td>
                <td>
                    <div class="input-group">
                        <input class="form-control d-block px-2 filter-input-change product-title" list="products-options"
                            placeholder="Виберіть назву" name="products-search" >
                    </div>
                    <datalist id="products-options">
                        {% for option in product_options %}
                            <option value="{{ option }}">{{ option }}</option>
                        {% endfor %}
                    </datalist>
                </td>
                <td>
                    <div class="form-outline">
                        <input required type="number" class="product-count form-control" name="count"/>
                        <div class="form-label">Введіть кількість</div>
                    </div>
                </td>
                <td></td>
                <td></td>
                <td>
                    <div class="form-outline">
                        <input type="number" class="form-control product-discount" name="discount" step=".01"/>
                        <div class="form-label">Введіть знижку</div>
                    </div>
                </td>
                <td></td>
                <td></td>
                <td></td>
                <td><button type="button" class="btn btn-danger delete-product">Видалити</button></td>
     
            </tr>
        `;
        $('#product-table-body').append(newRow);
        updateProductNumbers();
    }
    // Function to update product numbers
    function updateProductNumbers() {
        $('#product-table-body tr').each(function(index) {
            $(this).find('td:first').text(index + 1);
        });
    }
    function sendRequestToView() {
        let tableElement = document.getElementById('productsTable');

        if (tableElement) {
            // Create a new table element
            let newTable = document.createElement('table');
            newTable.style.margin = 'auto';
            newTable.style.width = '100%';
            // newTable.style.padding = '5px';


            newTable.style.borderCollapse = 'collapse';

            // Copy headers from the original table
            let headerRow = tableElement.querySelector('thead tr').cloneNode(true);
            headerRow.style.fontSize = '12px';
            let dataHeaders = headerRow.querySelectorAll('th');
            dataHeaders.forEach(dataHeader => {
                // dataHeader.style.border = '1px solid black';
                dataHeader.style.padding = '5px';
            })
            // headerRow.style.border = '1px solid black';

            newTable.appendChild(headerRow);

            // Copy data rows from the original table
            let dataRows = tableElement.querySelectorAll('tbody tr');
            dataRows.forEach(dataRow => {
                let newRow = document.createElement('tr');
                let dataCells = dataRow.querySelectorAll('td');

                dataCells.forEach(dataCell => {
                    let newDataCell = document.createElement('td');
                    let inputElement = dataCell.querySelector('input');

                    if (inputElement) {
                        newDataCell.textContent = inputElement.value; // Use input value
                    } else {
                        newDataCell.textContent = dataCell.textContent; // Copy data text
                    }
                    newDataCell.style.fontSize = '12px';
                    newDataCell.style.border = '1px solid black';
                    newDataCell.style.padding = '5px';

                    newRow.appendChild(newDataCell);
                });

                // Remove the last td element from the cloned row
                let lastCell = newRow.lastElementChild;
                lastCell.parentNode.removeChild(lastCell);

                newTable.appendChild(newRow);
            });


            // Get the HTML content of the simplified table
            let tableContent = newTable.outerHTML;
            let header = document.getElementById('template-header');
            let clonedHeader = header.cloneNode(true);
            clonedHeader.style.fontSize = "14px";
            // console.log(header.outerHTML)


            let container = document.createElement('div');
            container.innerHTML = clonedHeader.outerHTML + tableContent;

            let totalDeliveryElement = document.getElementById('totalDelivery');

            if (totalDeliveryElement) {
                let clonedTotalDeliveryElement = totalDeliveryElement.cloneNode(true);
                clonedTotalDeliveryElement.style.fontSize = '14px';
                clonedTotalDeliveryElement.style.marginTop = '10px';
                clonedTotalDeliveryElement.style.float = 'right';
                container.innerHTML += clonedTotalDeliveryElement.outerHTML;

                // Now 'clonedTotalDeliveryElement' is a clone of the original element and can be used separately.
            } else {
                console.error('totalDelivery element not found');
            }


            // Convert table HTML to PDF with landscape orientation
            html2pdf(container, {
                margin: 10,
                filename: 'table.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            });
        } else {
            console.error('Table element not found');
        }
    }

    // Attach the function to the button click event
    $('#sendRequestButton').click(function() {
        sendRequestToView();
    });


    $('#add-product').click(function() {
        addProductRow();
    });

    $('#productsTable').on('click', '.delete-product', function() {
        $(this).closest('tr').remove();
        updateProductNumbers();
    });

    $('#submit-changes').click(function(e) {
        let inputElements = document.querySelectorAll('.product-title');
        let datalistElement = document.querySelector('#products-options');
        for (let inputElement of inputElements){
            let validOptions = Array.from(datalistElement.options).map(option => option.dataset.value);
            if (validOptions.includes(inputElement.value)) {
                inputElement.setCustomValidity('');
            }
            else {
                inputElement.setCustomValidity('Виберіть продукт зі списку.');
            }
            inputElement.addEventListener('input', function () {
                let validOptions = Array.from(datalistElement.options).map(option => option.dataset.value);
                let inputValue = inputElement.value;
                if (!validOptions.includes(inputValue) || inputValue === "") {
                    inputElement.setCustomValidity('Виберіть продукт зі списку.');
                } else {
                    inputElement.setCustomValidity('');
                }
            });
        }

        let form = $('#edit-product-form')[0]; // Get the raw form element
        if (!form.checkValidity()) {
            form.reportValidity(); // Show native validation error messages
            return;
        }

        let productsData = [];

        $('#product-table-body tr').each(function() {
            let productRow = $(this);
            let id = productRow.data('pk');
            let title = productRow.find('.product-title').val();
            let count = productRow.find('.product-count').val();
            let discount = productRow.find('.product-discount').val();

            productsData.push({
                id: id,
                title: title,
                count: count,
                discount: discount
            });
        });

        let mainSettings = {};
        $('#main-settings').each(function() {

            let settingsRow = $(this);
            let costPDV = settingsRow.find('#costPDV').val();
            let countTrip = settingsRow.find('#countTrip').val();
            let deliveryWhere = settingsRow.find('input[name="inlineRadioOptionsDeliveryIn"]:checked').val();
            let distance = settingsRow.find('#distance').val();
            let tn_per_trip = settingsRow.find('#tn_per_trip').val();
            let guideOption = document.getElementById('guide-title').value;
            // console.log(guideOption)
            let isDelivery = settingsRow.find('input[name="inlineRadioOptionsDelivery"]:checked').val();
            // console.log(settingsRow.find('input[name="inlineRadioOptionsDelivery"]:checked'))
            // console.log(costPDV, countTrip, deliveryWhere, distance, tn_per_trip, isDelivery);
            mainSettings = {
                costPDV: costPDV,
                countTrip: countTrip,
                deliveryWhere: deliveryWhere,
                distance: distance,
                tn_per_trip: tn_per_trip,
                isDelivery: isDelivery,
                guideOption: guideOption,
            }
        });
        // let mainSettingsJSON = JSON.stringify(mainSettings);
        //
        // // Set a cookie named 'mainSettings' with the JSON string as the value
        // document.cookie = 'mainSettings=' + mainSettingsJSON;
        $.ajax({
            url: '',
            type: 'POST',
            data: {
                products: JSON.stringify(productsData),
                mainSettings: JSON.stringify(mainSettings),
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
            },
            success: function(data) {

                window.location.href = data.redirect_url;
                // document.cookie = 'mainSettings=' + mainSettingsJSON;

                // window.location.href = data.redirect_url + '?mainSettings=' + encodeURIComponent(data.mainSettings);

                // console.log(data)
                // location.reload();
                // Handle success, e.g., show a success message
            }
        });
    });
});

function calculateTotalSum(priceElements, totalSumElement) {
    let totalSum = 0;

    priceElements.forEach(function (priceElement) {
        let price = parseFloat(priceElement.innerText.replace(/[^\d.]/g, '')); // Remove non-numeric characters
        totalSum += price;
    });

    totalSumElement.innerText = formatCurrency(totalSum);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount).replace(',', ' ');
}
function sumOfWeights(weightGeneral, totalSumElement){
    let totalSum = 0;

    weightGeneral.forEach(function (priceElement) {
        let price = parseFloat(priceElement.innerText.replace(',', '.')); // Remove non-numeric characters
        totalSum += price;
    });
    totalSumElement.innerText += totalSum.toFixed(2).toString().replace('.', ',');
}

document.addEventListener("DOMContentLoaded", function () {
    const tables = document.querySelectorAll('.productsTable');

    const pricesLocal = document.querySelectorAll('.local-price');
    const totalSumElement = document.getElementById('local-total-sum');
    calculateTotalSum(pricesLocal, totalSumElement);
    const pricesGeneral = document.querySelectorAll('.general-price');
    const totalSumElementGeneral = document.getElementById('general-total-sum');
    calculateTotalSum(pricesGeneral, totalSumElementGeneral);
    const pricesGeneralDiscount = document.querySelectorAll('.general-price-discount');
    const totalSumElementGeneralDiscount = document.getElementById('general-total-sum-discount');
    calculateTotalSum(pricesGeneralDiscount, totalSumElementGeneralDiscount);

    const weightGeneral = document.querySelectorAll('.general-weight');
    const totalSumWeightGeneral = document.getElementById('general-total-weight-sum');
    sumOfWeights(weightGeneral, totalSumWeightGeneral);

    const totalDelivery = document.getElementById('totalDelivery');
    // console.log(totalDelivery);
    // console.log(totalSumElementGeneral.innerText)


    const selectedDeliveryOption = document.querySelector('input[name="inlineRadioOptionsDelivery"]:checked').value;
    const selectedDeliveryOptionIn = document.querySelector('input[name="inlineRadioOptionsDeliveryIn"]:checked').value;
    const costPDV = document.getElementById('costPDV').value.replace(',', '.');
    const countTrip = document.getElementById('countTrip').value;
    // console.log(selectedDeliveryOption)
    if (selectedDeliveryOption === 'deliveryWithout'){
        totalDelivery.innerText = 'Всього до сплати БЕЗ доставки з ПДВ: ' + totalSumElementGeneralDiscount.innerText + ' грн';
    }
    else if (selectedDeliveryOption === 'deliveryWith' && selectedDeliveryOptionIn === 'deliveryIn'){
        totalDelivery.innerText = 'Всього до сплати З доставкою з ПДВ: ' + totalSumElementGeneralDiscount.innerText + ' грн';
    }
    else {
        totalDelivery.innerHTML = 'Вартість продукції з ПДВ: ' + totalSumElementGeneralDiscount.innerText + ' грн' + '<br>';
        if (costPDV && countTrip){
            const currentValue = parseFloat(totalSumElementGeneralDiscount.innerText.replace(' ', ''));
            // console.log(currentValue)
            totalDelivery.innerHTML += 'Вартість Доставки з ПДВ: ' + formatCurrency(costPDV*countTrip) + ' грн' + '<br>';
            totalDelivery.innerHTML += 'Всього: ' + formatCurrency(currentValue + costPDV*countTrip)+ ' грн';
        }
        else {
            totalDelivery.innerHTML += 'Вартість Доставки з ПДВ: 0' + ' грн' + '<br>';
            totalDelivery.innerHTML += 'Всього: ' + totalSumElementGeneralDiscount.innerText + ' грн';
        }
    }


});
