// --- VARIABLES Y CONFIGURACIÓN INICIAL ---
const editableElements = document.querySelectorAll(
    '#invoiceNumber, .summary span, .item-row .detail, .item-row .cost, #deliveryTime'
);
const editButton = document.getElementById('editButton');
const addItemButton = document.getElementById('addItemButton');
const ul = document.getElementById('items-ul');
const invoiceDateInput = document.getElementById('invoiceDate');
let isEditing = false;

// Elementos del nuevo formulario
const formPrevio = document.getElementById('datos-previos-form');
const contenedorFormulario = document.getElementById('formulario-previo');
const contenedorPresupuesto = document.getElementById('presupuesto-content');

// Variables para la nueva funcionalidad de ítems en el formulario previo
const inputItemDetail = document.getElementById('input-item-detail');
const inputItemCost = document.getElementById('input-item-cost');
const agregarItemBtn = document.getElementById('agregar-item-btn');
const listaItemsAgregados = document.getElementById('lista-items-agregados');

// Array para almacenar los ítems agregados antes de generar el presupuesto
const itemsAgregados = [];


document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('input-fecha').value = today;

    invoiceDateInput.setAttribute('readonly', true);
    updateTotals();
});

// --- MANEJO DE AGREGAR ÍTEMS EN EL FORMULARIO PREVIO ---
agregarItemBtn.addEventListener('click', () => {
    const detail = inputItemDetail.value.trim();
    const cost = parseFloat(inputItemCost.value);

    if (detail && !isNaN(cost) && cost >= 0) {
        // Agregar al array interno
        itemsAgregados.push({ detail, cost });

        // Mostrar el ítem en la lista temporal
        const li = document.createElement('li');
        // Formatear el costo para la previsualización
        const costFormatted = cost.toLocaleString('es-AR', { minimumFractionDigits: 0 });
        li.innerHTML = `<span>${detail}</span> - <strong>$${costFormatted}</strong>`;
        listaItemsAgregados.appendChild(li);

        // Limpiar inputs y enfocar
        inputItemDetail.value = '';
        inputItemCost.value = '';
        inputItemDetail.focus();
    } else {
        alert('Por favor, ingresa un detalle válido y un costo numérico mayor o igual a cero.');
    }
});


// --- MANEJO DEL SUBMIT DEL FORMULARIO PREVIO ---
formPrevio.addEventListener('submit', (e) => {
    e.preventDefault();

    if (itemsAgregados.length === 0) {
        alert('Debes agregar al menos un item al presupuesto antes de generarlo.');
        return;
    }

    // 1. Recoger datos
    const fecha = document.getElementById('input-fecha').value;
    const cliente = document.getElementById('input-cliente').value;
    const proyecto = document.getElementById('input-proyecto').value;
    const numero = document.getElementById('input-numero').value;

    // 2. Poblar el Presupuesto
    invoiceDateInput.value = fecha;
    document.getElementById('cliente-summary').textContent = cliente;
    document.getElementById('proyecto-summary').textContent = proyecto;
    document.getElementById('invoiceNumber').textContent = numero.padStart(3, '0');

    // 3. Poblar la lista de Ítems
    const itemsUl = document.getElementById('items-ul');
    itemsUl.innerHTML = '';

    itemsAgregados.forEach(item => {
        const newLi = document.createElement('li');
        const costFormatted = item.cost.toLocaleString('es-AR', { minimumFractionDigits: 0 });

        newLi.innerHTML = `
            <div class="item-row sub">
                <div class="detail" contenteditable="false">${item.detail}</div>
                <button class="delete-item-btn" onclick="removeItem(this)">❌</button>
                <div class="cost" contenteditable="false" onblur="updateTotals()">$${costFormatted}</div>
            </div>
        `;
        itemsUl.appendChild(newLi);
    });


    // 4. Ocultar el formulario y mostrar el presupuesto
    contenedorFormulario.classList.add('hidden');
    contenedorPresupuesto.classList.remove('hidden');

    // 5. Recalcular totales con los nuevos ítems
    updateTotals();
});


/**
 * Toggles contentEditable attribute for all marked elements and shows/hides control buttons.
 */
function toggleEdit() {
    isEditing = !isEditing;

    editableElements.forEach(el => {
        if (el.classList.contains('detail') || el.classList.contains('cost')) {
            if (el.closest('.item-row') && el.closest('.item-row').classList.contains('sub')) {
                el.contentEditable = isEditing;
            }
        } else {
            el.contentEditable = isEditing;
        }
    });

    if (isEditing) {
        invoiceDateInput.removeAttribute('readonly');
        invoiceDateInput.style.pointerEvents = 'auto';

        editButton.textContent = '💾 Guardar Cambios';
        editButton.style.backgroundColor = '#dc3545';
        addItemButton.style.display = 'inline-block';

    } else {
        invoiceDateInput.setAttribute('readonly', true);
        invoiceDateInput.style.pointerEvents = 'none';

        editButton.textContent = '📝 Editar Contenido';
        editButton.style.backgroundColor = '#007bff';
        addItemButton.style.display = 'none';

        updateTotals();
    }

    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.style.visibility = isEditing ? 'visible' : 'hidden';
    });

    let elements = document.querySelectorAll('[contenteditable]');
    elements.forEach(function (element) {
        element.setAttribute('contenteditable', isEditing ? 'true' : 'false');
    });
}

/**
 * Agrega un nuevo elemento de lista al presupuesto (usado desde el botón en el presupuesto).
 */
function addNewItem() {
    const newLi = document.createElement('li');
    newLi.innerHTML = `
        <div class="item-row sub">
            <div class="detail" contenteditable="true" onclick="finishEditing(this)">Nuevo Item (Descripción)</div>
            <button class="delete-item-btn" onclick="removeItem(this)">❌</button>
            <div class="cost" contenteditable="true" onblur="finishEditing(this)">$ 0</div>
        </div>
    `;
    if (isEditing) {
        newLi.querySelectorAll('.delete-item-btn').forEach(btn => btn.style.visibility = 'visible');
    }
    ul.appendChild(newLi);
    newLi.querySelector('.detail').focus();
    updateTotals();
}

/**
 * Removes a specific item when its individual delete button is clicked.
 */
function removeItem(button) {
    const li = button.closest('li');
    if (li) {
        ul.removeChild(li);
        updateTotals();
    }
}

/**
* Termina la edición de un elemento, eliminando el atributo contenteditable.
*/
function finishEditing(element) {
    if (!isEditing) {
        element.setAttribute('contenteditable', 'false');
    }
    if (element.classList.contains('cost')) {
        updateTotals();
    }
}

/**
 * Calcula el costo total y el monto del depósito del 50%.
 */
function updateTotals() {
    const costElements = document.querySelectorAll('.item-row.sub .cost');
    let total = 0;

    costElements.forEach(costEl => {
        const text = costEl.textContent.replace(/[$.]/g, '');
        const value = parseFloat(text.replace(',', '.'));

        if (!isNaN(value)) {
            total += value;
        }

        if (isEditing) {
            costEl.textContent = `$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
        }
    });

    const deposit = total * 0.50;

    const totalFormatted = total.toLocaleString('es-AR', { minimumFractionDigits: 0 });
    const depositFormatted = deposit.toLocaleString('es-AR', { minimumFractionDigits: 0 });

    document.getElementById('totalAmount').innerHTML = `$${totalFormatted}<span class="ars">ARS</span>`;
    document.getElementById('depositAmount').textContent = `$${depositFormatted}`;
}

// --- FUNCIONES DE EXPORTACIÓN ---

/**
 * Exporta el contenido del presupuesto como una imagen JPG utilizando html2canvas.
 */
function exportAsImage() {
    const input = document.getElementById('presupuesto-content');

    // Ocultar temporalmente los controles que no deben aparecer en la imagen
    const controls = document.querySelector('.controls');
    controls.classList.add('hidden');

    // Revertir el estado de edición antes de capturar (para ocultar los bordes punteados)
    const wasEditing = isEditing;
    if (wasEditing) {
        toggleEdit(); // Desactiva la edición si está activa
    }

    // Usar html2canvas para renderizar el DIV en un canvas
    html2canvas(input, {
        scale: 3, // Aumenta la escala para una mejor resolución (mayor calidad)
        useCORS: true, // Importante para imágenes externas
        allowTaint: true // Puede ser necesario para imágenes locales
    }).then(function (canvas) {
        // Convertir el canvas a una URL de datos (JPG con calidad 0.9)
        const imgData = canvas.toDataURL('image/jpg', 0.9);

        // Crear un enlace temporal para forzar la descarga
        const link = document.createElement('a');
        // Asignar un nombre de archivo dinámico
        link.download = 'presupuesto_' + document.getElementById('cliente-summary').textContent.trim().replace(/\s/g, '_') + '.jpg';
        link.href = imgData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Volver a mostrar los controles y restaurar el modo de edición
        controls.classList.remove('hidden');
        if (wasEditing) {
            toggleEdit(); // Reactiva la edición si estaba activa
        }
    });
}

/**
 * Genera un PDF utilizando la función nativa de impresión del navegador.
 * El usuario deberá seleccionar "Guardar como PDF" en el cuadro de diálogo.
 */
function exportAsPdf() {
    window.print();
}

function Imprimir() {
    window.print();
}