const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const bwipjs = require('bwip-js');

function createWindow() {
  const win = new BrowserWindow({
    width: 300,
    height: 400,
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

async function generateBarcodeImage(barcodeType, barcodeData) {

  try {
    let widthtmp = 3 * 0.3527;
    const options = {
      bcid: barcodeType,
      text: '111',
      width: 30,
      scaleY: 1,
      scaleX: 1,
      paddingwidth: 0,
      paddingheight: 0,
      height: 20, // Set height to 20 mm
      includetext: true,
      textxalign: 'center',
    };

    const buffer = await bwipjs.toBuffer(options);
    return buffer;
  } catch (error) {
    console.error('Error generating barcode image:', error);
    throw error;
  }
}

async function printBarcode(barcodeType, barcodeData) {
  let widthTemp = 390;
  let heightTemp = 355;
  const win = new BrowserWindow({
    width: widthTemp,
    height: heightTemp,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadURL('data:text/html;charset=utf-8,<html><body><img id="barcode"></body></html>');

  const barcodeImage = await generateBarcodeImage(barcodeType, barcodeData);
  const barcodeImageBase64 = barcodeImage.toString('base64');

  win.webContents.executeJavaScript(`
    const barcodeImg = document.getElementById('barcode');
    barcodeImg.src = 'data:image/png;base64,${barcodeImageBase64}';
  `);

  win.webContents.on('did-finish-load', () => {
    win.webContents.print({
      silent: false,
      printBackground: true,
      color: false,
      margins: {
        marginType: 'none',
      },
      landscape: false,
      scaleFactor: 100,
      pageSize: { width: widthTemp, height: heightTemp }, // Exact size of the label in pixels
    }, (success, errorType) => {
      if (!success) {
        console.error('Failed to print:', errorType);
        dialog.showErrorBox('Print Error', `Failed to print: ${errorType}`);
      } else {
        console.log('Print successful');
      }
    });
  });
}

ipcMain.handle('print-barcode', async (event, barcodeData) => {
  await printBarcode('code128', barcodeData); // Pass the barcode data to print
});
