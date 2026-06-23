const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Ensure degrees output directory exists
const degreesDir = path.join(__dirname, '../uploads/degrees');
if (!fs.existsSync(degreesDir)) {
  fs.mkdirSync(degreesDir, { recursive: true });
}

/**
 * Generates a high-quality PDF Certificate with an embedded verification QR Code
 * @param {Object} degree - Degree mongoose model object
 * @returns {Promise<string>} - Relative path to the generated PDF file
 */
const generateDegreePDF = async (degree) => {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfFileName = `degree-${degree.degreeSerialNumber}-${Date.now()}.pdf`;
      const pdfFilePath = path.join(degreesDir, pdfFileName);
      
      // Verification link embedded in QR Code
      // In production, this would be the live verification URL, e.g., https://verify.iqra.edu.pk/verify/HASH
      const hostUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verificationUrl = `${hostUrl}/verify/${degree.degreeHash}`;
      
      // Generate QR Code as PNG Buffer
      const qrBuffer = await QRCode.toBuffer(verificationUrl, {
        errorCorrectionLevel: 'H',
        type: 'png',
        margin: 1,
        width: 120,
        color: {
          dark: '#1e293b', // Sleek charcoal
          light: '#ffffff'
        }
      });
      
      // Create a Landscape PDF (Standard Certificate size)
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });
      
      const writeStream = fs.createWriteStream(pdfFilePath);
      doc.pipe(writeStream);
      
      // --- Draw Certificate Design ---
      
      // Background Outer Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(4)
         .stroke('#1e293b'); // Navy slate border
         
      // Inner Border
      doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52)
         .lineWidth(1.5)
         .stroke('#d97706'); // Gold border
         
      // University Header
      doc.fillColor('#1e293b')
         .font('Helvetica-Bold')
         .fontSize(32)
         .text('IQRA UNIVERSITY', { align: 'center', paragraphGap: 10 });
         
      doc.fillColor('#475569')
         .font('Helvetica-Oblique')
         .fontSize(14)
         .text('Upon the recommendation of the Faculty and by virtue of the authority vested in them, has conferred on', { align: 'center', paragraphGap: 15 });
         
      // Graduate Name
      doc.fillColor('#d97706') // Golden Text
         .font('Helvetica-Bold')
         .fontSize(28)
         .text(degree.graduateName.toUpperCase(), { align: 'center', paragraphGap: 15 });
         
      // Degree Program
      doc.fillColor('#1e293b')
         .font('Helvetica')
         .fontSize(16)
         .text('the degree of', { align: 'center', paragraphGap: 10 });
         
      doc.fillColor('#1e293b')
         .font('Helvetica-Bold')
         .fontSize(22)
         .text(degree.programName, { align: 'center', paragraphGap: 15 });
         
      // Graduation details
      const gradDateString = new Date(degree.graduationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      doc.fillColor('#475569')
         .font('Helvetica')
         .fontSize(12)
         .text(`With all the Rights, Honors, and Privileges pertaining to that degree.`, { align: 'center', paragraphGap: 5 });
         
      doc.text(`Given on this ${gradDateString} with CGPA of ${degree.cgpa.toFixed(2)}`, { align: 'center', paragraphGap: 30 });
      
      // Footer Elements: Signatures, Seal, QR Code
      const footerY = 380;
      
      // Left Signature line
      doc.moveTo(100, footerY + 40)
         .lineTo(250, footerY + 40)
         .lineWidth(1)
         .stroke('#94a3b8');
         
      doc.fillColor('#475569')
         .font('Helvetica')
         .fontSize(10)
         .text('Dean of Faculty', 100, footerY + 45, { width: 150, align: 'center' });
         
      // Right Signature line
      doc.moveTo(doc.page.width - 250, footerY + 40)
         .lineTo(doc.page.width - 100, footerY + 40)
         .lineWidth(1)
         .stroke('#94a3b8');
         
      doc.text('Registrar', doc.page.width - 250, footerY + 45, { width: 150, align: 'center' });
      
      // Embed QR Code in bottom center
      const qrX = (doc.page.width / 2) - 60; // Center the 120px QR Code
      doc.image(qrBuffer, qrX, footerY - 20, { width: 120 });
      
      // QR Label
      doc.fillColor('#64748b')
         .font('Helvetica')
         .fontSize(8)
         .text('SCAN TO VERIFY DEGREE', qrX, footerY + 105, { width: 120, align: 'center' });
         
      // Serial Number and Hash labels (metadata)
      doc.fillColor('#94a3b8')
         .font('Courier')
         .fontSize(8)
         .text(`Serial: ${degree.degreeSerialNumber}`, 40, doc.page.height - 50, { align: 'left' });
         
      doc.text(`Hash: ${degree.degreeHash}`, 40, doc.page.height - 40, { align: 'left' });
      
      doc.end();
      
      writeStream.on('finish', () => {
        // Return relative path for client serving
        const relativePath = `/uploads/degrees/${pdfFileName}`;
        resolve(relativePath);
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateDegreePDF };
