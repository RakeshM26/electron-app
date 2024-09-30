const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const bwipjs = require('bwip-js');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Get connected printers
ipcMain.handle('get-printers', async (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    try {
      const printers = await win.webContents.getPrintersAsync();
      return printers;
    } catch (err) {
      console.error('Failed to get printers:', err);
      return [];
    }
  } else {
    return [];
  }
});

// Generate and print the barcode
async function printBarcode(printerName, barcodeData) {
  const win = new BrowserWindow({
    width: 400,
    height: 'auto',
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Generate the barcode using bwip-js
  const barcodeImage = await bwipjs.toBuffer({
    bcid: 'code128',       // Barcode type
    text: barcodeData,     // Barcode data
    scale: 3,              // Scaling factor
    height: 10,            // Height of the barcode
    includetext: true,     // Include the text below the barcode
    textxalign: 'center',  // Center align the text
  });

  // Load a custom HTML page for printing the barcode
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <html>
    <body style="margin: 0; padding: 0;">
      <div id="print" style="width: 70mm; height: auto;">
        <img src="data:image/png;base64,${barcodeImage.toString('base64')}" style="width: 100%; height: auto;">
      </div>
    </body>
    </html>
  `));

  // Wait for the window to load, then print the content
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      window.scrollTo(0, document.body.scrollHeight); // Scroll to render all content
    `).then(() => {
      win.webContents.print({
        silent: true,
        printBackground: false,
        deviceName: printerName,
      }, (success, failureReason) => {
        if (!success) {
          console.error('Failed to print:', failureReason);
        } else {
          console.log('Print successful');
        }
        win.close(); // Close the print window after the job is done
      });
    });
  });
}

// Print PRN file using `lp` command
ipcMain.handle('print-prn', (event, printerName, prnFilePath) => {
  exec(`lp -d ${printerName} -o raw ${prnFilePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error printing PRN file: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Print stderr: ${stderr}`);
      return;
    }
    console.log(`Print stdout: ${stdout}`);
  });
});

// Handle print-barcode event
ipcMain.handle('print-barcode', async (event, barcodeData, printerName) => {
  if (!printerName) {
    console.error('No printer selected');
    return;
  }
  printBarcode(printerName, barcodeData); // Pass selected printer name
});
