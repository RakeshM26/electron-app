const { ipcRenderer } = require('electron');

window.onload = () => {
  ipcRenderer.invoke('get-printers').then(printers => {
    console.log('Printers:', printers); // Log printers to console
    const printerList = document.getElementById('printers');
    printers.forEach(printer => {
      const li = document.createElement('li');
      li.textContent = printer.name;
      printerList.appendChild(li);
    });
  }).catch(err => {
    console.error('Failed to get printers:', err);
  });
};

document.getElementById('printTestButton').addEventListener('click', () => {
  ipcRenderer.invoke('print-test');
});


// Handle print barcode button click
document.getElementById('printBarcodeButton').addEventListener('click', () => {
  const barcodeData = document.getElementById('barcodeInput').value;
  ipcRenderer.invoke('print-barcode', barcodeData);
});
