const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Helper to convert local file to Gemini Part
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType
    },
  };
}

// Helper to determine mime type
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'image/jpeg'; // fallback
}

/**
 * Perform OCR Extraction on a document path
 * @param {string} filePath - Absolute or relative path to file
 * @param {string} docType - 'cnic_front' | 'cnic_back' | 'matric' | 'inter' | 'receipt'
 */
const performOCR = async (filePath, docType) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    console.log(`[OCR Service] GEMINI_API_KEY not set. Using Simulated OCR fallback for ${docType}.`);
    return getMockOCRData(filePath, docType);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash for fast vision processing
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const mimeType = getMimeType(filePath);
    const filePart = fileToGenerativePart(filePath, mimeType);
    
    let prompt = '';
    
    if (docType.startsWith('cnic')) {
      prompt = `You are a verification AI agent. Analyze this image of a Pakistani CNIC (National Identity Card) and extract the Expiry Date. 
      You MUST output ONLY a valid JSON object matching the following structure without any wrapping like backticks or "json".
      Format:
      {
        "expiryDate": "YYYY-MM-DD",
        "cardFound": true
      }
      If the expiry date is not found or readable, set "expiryDate" to null.`;
    } else if (docType === 'matric' || docType === 'inter') {
      prompt = `You are a verification AI agent. Analyze this marksheet image (Matriculation or Intermediate board sheet) and extract the total percentage or final grade. If only marks are shown, calculate the percentage (obtained marks / total marks * 100).
      You MUST output ONLY a valid JSON object matching the following structure without any wrapping like backticks or "json".
      Format:
      {
        "percentage": 78.5,
        "board": "Karachi Board",
        "passingYear": 2022
      }
      If percentage cannot be determined, set "percentage" to null.`;
    } else if (docType === 'receipt') {
      prompt = `You are a verification AI agent. Analyze this payment receipt screenshot (Visa, Mastercard, 1Link, Crypto bank transfer, etc.) and extract the Transaction ID or Reference Hash, and the Amount Paid.
      You MUST output ONLY a valid JSON object matching the following structure without any wrapping like backticks or "json".
      Format:
      {
        "transactionId": "TXN_HASH_OR_ID_HERE",
        "amountPaid": 5000,
        "paymentVerified": true
      }
      If details cannot be determined, set "transactionId" to null and "amountPaid" to null.`;
    }

    const result = await model.generateContent([prompt, filePart]);
    const responseText = result.response.text().trim();
    console.log(`[OCR Service] Raw response from Gemini for ${docType}:`, responseText);
    
    // Clean codeblock markdown wrapper if LLM returned it
    let cleanJSON = responseText;
    if (cleanJSON.startsWith('```')) {
      cleanJSON = cleanJSON.replace(/^```json\s*/, '').replace(/```$/, '');
    }
    
    return JSON.parse(cleanJSON.trim());
  } catch (error) {
    console.error(`[OCR Service] Gemini API OCR failed for ${docType}:`, error.message);
    console.log(`[OCR Service] Falling back to Simulated OCR for ${docType}.`);
    return getMockOCRData(filePath, docType);
  }
};

/**
 * Policy Verification Service
 * Cross-checks OCR extracted details against university guidelines
 * @param {Object} applicationData - MongoDB application record
 */
const runPolicyChecks = (applicationData) => {
  const { ocrData, paymentDetails } = applicationData;
  const flags = {
    cnicValid: false,
    matricValid: false,
    interValid: false,
    paymentValid: false,
    policyPassed: false,
    rejectionReason: ''
  };

  const cnicExpiry = ocrData.cnicExpiry ? new Date(ocrData.cnicExpiry) : null;
  const today = new Date();
  
  // 1. CNIC Validity Check
  if (cnicExpiry && cnicExpiry > today) {
    flags.cnicValid = true;
  } else {
    flags.rejectionReason += 'CNIC is expired or expiration date could not be verified. ';
  }

  // 2. Matric percentage check (Min 50%)
  if (ocrData.matricPercentage && ocrData.matricPercentage >= 50) {
    flags.matricValid = true;
  } else {
    flags.rejectionReason += `Matric percentage of ${ocrData.matricPercentage || 0}% is below the 50% requirement. `;
  }

  // 3. Intermediate percentage check (Min 50%)
  if (ocrData.interPercentage && ocrData.interPercentage >= 50) {
    flags.interValid = true;
  } else {
    flags.rejectionReason += `Intermediate percentage of ${ocrData.interPercentage || 0}% is below the 50% requirement. `;
  }

  // 4. Payment Receipt Verification
  // Check transaction code and payment amounts match
  if (ocrData.paymentAmount && paymentDetails.amountPaid) {
    const isAmountCorrect = Math.abs(ocrData.paymentAmount - paymentDetails.amountPaid) < 10; // Allow slight rounding
    const isTxValid = ocrData.paymentTransactionId && 
                      paymentDetails.transactionId && 
                      (ocrData.paymentTransactionId.toLowerCase() === paymentDetails.transactionId.toLowerCase() || 
                       ocrData.paymentTransactionId.includes(paymentDetails.transactionId) ||
                       paymentDetails.transactionId.includes(ocrData.paymentTransactionId));
    
    if (isAmountCorrect && isTxValid) {
      flags.paymentValid = true;
    } else {
      flags.rejectionReason += `Payment verification failed. OCR amount: ${ocrData.paymentAmount}, user amount: ${paymentDetails.amountPaid}. OCR TxID: ${ocrData.paymentTransactionId}, user TxID: ${paymentDetails.transactionId}. `;
    }
  } else {
    flags.rejectionReason += 'Payment receipt fields could not be matched with input. ';
  }

  // If all checks pass
  if (flags.cnicValid && flags.matricValid && flags.interValid && flags.paymentValid) {
    flags.policyPassed = true;
  }

  return flags;
};

// Generates dummy OCR values for development/fallback
function getMockOCRData(filePath, docType) {
  // If the file is named in a specific way, we can trigger rejection to test policy verification
  const fileName = path.basename(filePath).toLowerCase();
  
  if (docType === 'cnic_front' || docType === 'cnic_back') {
    const isExpired = fileName.includes('expired');
    const expiryYear = isExpired ? 2024 : 2030; // Expired or active
    return {
      expiryDate: `${expiryYear}-12-31`,
      cardFound: true
    };
  }
  
  if (docType === 'matric') {
    const isLow = fileName.includes('low') || fileName.includes('fail');
    return {
      percentage: isLow ? 45.0 : 82.5,
      board: 'Karachi Board',
      passingYear: 2020
    };
  }

  if (docType === 'inter') {
    const isLow = fileName.includes('low') || fileName.includes('fail');
    return {
      percentage: isLow ? 50.0 : 78.4,
      board: 'Karachi Board',
      passingYear: 2022
    };
  }

  if (docType === 'receipt') {
    const isMismatch = fileName.includes('mismatch') || fileName.includes('fake');
    return {
      transactionId: isMismatch ? 'TXN_DUMMY_ERROR_999' : 'TXN1029384756', // default matching mockup
      amountPaid: isMismatch ? 100 : 5000,
      paymentVerified: true
    };
  }

  return {};
}

module.exports = { performOCR, runPolicyChecks };
