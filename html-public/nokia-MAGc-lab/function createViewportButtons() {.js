const inputColumn = document.createElement('div');
inputColumn.className = `column is-8 p-1 pl-3`;
inputColumn.id = `${labelColumn.id}-inputColumn${config.idSuffix}`

const inputElement = document.createElement('div');
inputElement.className = `field has-addons`;
inputElement.id = `${inputColumn.id}-label${config.idSuffix}`

// create addon input
const controlId = `${inputElement.id}-control`;
const control = document.createElement('p');
control.className = 'control';
control.id = controlId;
const input = document.createElement('input');
input.id = `${controlId}-input`;

input.className = `input is-size-7 has-text-left link-impairment-widht has-text-weight-normal is-smallest-element`; 
input.value = config.columntInputContent;
control.appendChild(input);
inputElement.appendChild(control);

// create addon button
addons = config.addonsContent
for (let i = 0; i < addons.length; i++) {
    const addon = addons[i];
    const controlId = `${inputElement.id}-control${addon.name}`;
    const control = document.createElement('p');
    control.className = 'control';
    control.id = controlId;
  
    // Create a button element
    const button = document.createElement('a'); 
    button.id = `${controlId}-button${addon.name}`;
    button.className = `button is-light is-outlined px-3 is-smallest-element is-${addon.name === 'blue' ? 'link' : 'success'}`;
    if (addon.hrefFunction == 'linkImpairment'){ 
        if (addon.hrefFunctionArg == 'start'){
            button.classList.add('impairment-start')						
            button.addEventListener('click', () => {
                console.log('impairmentStartButton is clicked')
                linkImpairmentManager('start', addon.hrefLink)  
            });
        }
        else if (addon.hrefFunctionArg == 'stop'){
            button.classList.add('impairment-stop')
            button.addEventListener('click', () => {
                console.log('impairmentStoptButton is clicked')
                linkImpairmentManager('stop', addon.hrefLink) 
            });
        }
    }
}

