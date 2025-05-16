console.log('gamestep_tabs.js: универсальный режим');

document.addEventListener('DOMContentLoaded', function() {
    function renderOptionsEditor() {
        var optionsField = document.getElementById('id_options');
        if (!optionsField) return;
        let options = {};
        try {
            options = optionsField.value ? JSON.parse(optionsField.value) : {};
        } catch (e) {
            options = {};
        }
        let container = document.getElementById('options-editor');
        if (!container) {
            container = document.createElement('div');
            container.id = 'options-editor';
            optionsField.parentNode.insertBefore(container, optionsField.nextSibling);
        }
        container.innerHTML = '';
        Object.entries(options).forEach(([key, value]) => {
            let row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '8px';
            row.style.marginBottom = '6px';
            let label = document.createElement('input');
            label.type = 'text';
            label.value = key;
            label.placeholder = 'Ключ';
            label.style.width = '140px';
            let input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.placeholder = 'Значение';
            input.style.flex = '1';
            let delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.textContent = '✕';
            delBtn.style.color = '#e57373';
            delBtn.onclick = function() {
                container.removeChild(row);
                updateOptionsFromEditor();
            };
            row.appendChild(label);
            row.appendChild(input);
            row.appendChild(delBtn);
            container.appendChild(row);
            label.addEventListener('input', updateOptionsFromEditor);
            input.addEventListener('input', updateOptionsFromEditor);
        });
        let addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.textContent = 'Добавить поле';
        addBtn.style.marginTop = '8px';
        addBtn.onclick = function() {
            let row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '8px';
            row.style.marginBottom = '6px';
            let label = document.createElement('input');
            label.type = 'text';
            label.placeholder = 'Ключ';
            label.style.width = '140px';
            let input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Значение';
            input.style.flex = '1';
            let delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.textContent = '✕';
            delBtn.style.color = '#e57373';
            delBtn.onclick = function() {
                container.removeChild(row);
                updateOptionsFromEditor();
            };
            row.appendChild(label);
            row.appendChild(input);
            row.appendChild(delBtn);
            container.insertBefore(row, addBtn);
            label.addEventListener('input', updateOptionsFromEditor);
            input.addEventListener('input', updateOptionsFromEditor);
        };
        container.appendChild(addBtn);
        function updateOptionsFromEditor() {
            let rows = Array.from(container.querySelectorAll('div'));
            let obj = {};
            rows.forEach(row => {
                let inputs = row.querySelectorAll('input');
                if (inputs.length >= 2) {
                    let k = inputs[0].value.trim();
                    let v = inputs[1].value;
                    if (k) obj[k] = v;
                }
            });
            optionsField.value = JSON.stringify(obj);
        }
    }
    // Показываем редактор options при загрузке и при изменении поля options
    let optionsField = document.getElementById('id_options');
    if (optionsField) {
        renderOptionsEditor();
        optionsField.addEventListener('input', renderOptionsEditor);
    }
}); 