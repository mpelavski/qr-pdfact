const fs = require("fs");
const fsp = fs.promises;
const { argv } = require("process");
const PDFParser = require("pdf-parse");
const { fromPath } = require('pdf2pic');
const { exec } = require('child_process');
const sharp = require('sharp');

// Función para redimensionar una imagen PNG
const inputFile = "./factPng.1.png";
const outputFile = "./factPng.png";
const percentage = 100;

async function trypngresize(inputFile, outputFile, percentage) {
    try {
        await sharp(inputFile)
            .resize({ width: percentage })
            .toFile(outputFile); 
        console.log(`PNG resized to ${percentage}% and saved to ${outputFile}`);
    } catch (error) {
        console.error(`Error resizing PNG: ${error.message}`);
    }
}

// # Second, try extracting raw images from PNG(3 methods).
async function tryimages(imageFilePath) {
    try {
        // Define el comando zbarimg para buscar códigos QR en la imagen PNG.
        console.error("  - Trying zbarimg.");
        const zbarimgCommand = `/usr/bin/zbarimg --set *.enable=0 --set qrcode.enable=1 -q ${imageFilePath}`;
        const zbarimgOutput = await runCommand(zbarimgCommand);

        console.log("imageFilePath:", imageFilePath);
        console.log("Command:", zbarimgCommand);
        console.log("Output:", zbarimgOutput);

        // Divide la salida de zbarimg en líneas basadas en la cadena 'QR-Code'
        const matches = zbarimgOutput
            .split('QR-Code:')
            //.filter(line => line.includes('000201') && line.includes('ar.gob.agip'));

        return matches;
    } catch (error) {
        throw new Error(`Error in readQRCodeFromImage: ${error.message}`);
    }
}

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, { encoding: 'utf-8' }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Error executing command: ${error.message}`));
                return;
            }
            resolve(stdout.trim());
        });
    });
}

// # First, try converting PDF's first page to PNG.
async function trypng(pdfFilePath) {
    const options = {
        density: 100,
        saveFilename: 'factPng',
        format: 'png',
        width: 600,
        height: 600,
    };

    const convert = fromPath(pdfFilePath, options);
    const pageToConvertAsImage = 1;

    try {
        const imageFilePath = await convert(pageToConvertAsImage, {
            responseType: 'image',
        });
        return imageFilePath;
        
    } catch (error) {
        console.error('Conversion error:', error);
        throw new Error(`Error in trypng: ${error.message}`);
    }
}

async function readPDF() {
    try {
        // Verifica si se proporciona la ruta del archivo PDF como argumento.
        if (argv.length < 3) {
            console.error(
                "Por favor, proporciona la ruta del archivo PDF como argumento."
            );
            process.exit(1);
        }

        // Obtener la ruta del archivo PDF desde los argumentos de la línea de comandos
        const pdfFilePath = argv[2];

        // Verificar si el archivo PDF existe
        try {
            await fsp.access(pdfFilePath, fs.constants.F_OK);
            console.log(`El archivo PDF en la ruta '${pdfFilePath}' existe.`);
        } catch (error) {
            console.error(`El archivo PDF en la ruta '${pdfFilePath}' no existe.`);
            process.exit(1);
        }
        
        // # First, try converting PDF's first page to PNG.
        const imageFilePath = await trypng(pdfFilePath);

        // # Second, try extracting raw images from PNG.
        const qrCodeText = await tryimages(imageFilePath.path);

        // # Third, try converting PDF's first page to PNG and then shrinking.    
        if (qrCodeText.length === 0) {
            console.log("No se detecto el QR:", qrCodeText);
            await trypngresize(data, 50);
            await tryimages(outputFile);
        }else{
            console.log("QR=", qrCodeText);
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

// Invocar a la función principal
readPDF();
