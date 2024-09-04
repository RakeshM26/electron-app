const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { dialog } = require('electron');
const fs = require('fs');
const { exec } = require('child_process');
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

ipcMain.handle('print-test', async () => {
  const win = BrowserWindow.getFocusedWindow();
  win.webContents.print({
    silent: false,          // Set to true if you don't want the print dialog to appear
    printBackground: true,  // Print the background graphics (if any)
  }, (success, errorType) => {
    if (!success) {
      console.error('Failed to print:', errorType);
    } else {
      console.log('Print success');
    }
  });
});

ipcMain.handle('print-barcode', async (event, barcodeData) => {
  const win = BrowserWindow.getFocusedWindow();

  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',   // Barcode type
      text: barcodeData, // Text to encode
      scale: 3,           // 3x scaling factor
      height: 10,          // Bar height, in millimeters
      includetext: true,        // Show human-readable text
      textxalign: 'center',    // Center-align the text
    });

    const barcodePath = path.join(__dirname, 'barcode.png');
    fs.writeFileSync(barcodePath, png);

    win.webContents.print({
      silent: false, // Change to true to test silent printing
      deviceName: 'Bar-Code-Printer-TT065-50', 
      printBackground: true,
    }, (success, errorType) => {
      console.log(success,'success message');
      console.log(errorType,'errorType message')
      if (!success) {
        console.error('Failed to print:', errorType);
      } else {
        console.log('Print successful');
      }
    });
  } catch (err) {
    console.error('Error generating or printing barcode:', err);
  }
});
