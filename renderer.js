const { ipcRenderer } = require('electron');

// Fetch printers on load
window.onload = () => {
  ipcRenderer.invoke('get-printers').then(printers => {
    console.log('Printers:', printers); // Log printers to console
    const printerList = document.getElementById('printers');
    printers.forEach(printer => {
      const li = document.createElement('li');
      li.textContent = printer.name;
      li.addEventListener('click', () => {
        document.getElementById('selectedPrinter').textContent = printer.name; // Display selected printer
      });
      printerList.appendChild(li);
    });
  }).catch(err => {
    console.error('Failed to get printers:', err);
  });
};

// Handle print barcode button click
document.getElementById('printBarcodeButton').addEventListener('click', () => {
  const barcodeData = document.getElementById('barcodeInput').value;
  const selectedPrinter = document.getElementById('selectedPrinter').textContent;

  if (selectedPrinter) {
    ipcRenderer.invoke('print-barcode', barcodeData, selectedPrinter); // Pass selected printer name
  } else {
    console.error('No printer selected');
  }
});

// Handle PRN file printing
document.getElementById('printPrnButton').addEventListener('click', () => {
  const selectedPrinter = document.getElementById('selectedPrinter').textContent;
  const prnFilePath = '/home/Downloads/test.prn'; // Path to the PRN file you want to print

  if (selectedPrinter && prnFilePath) {
    ipcRenderer.invoke('print-prn', selectedPrinter, prnFilePath);
  } else {
    console.error('No printer or PRN file selected');
  }
});
