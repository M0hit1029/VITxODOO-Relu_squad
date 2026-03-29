function parseDateCandidate(text) {
  const match = text.match(/\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/)
  return match?.[1] ?? ''
}

function parseAmountCandidate(text) {
  const match = text.match(/(?:total|amount|grand total)[:\s]*[$€£₹]?\s*([\d,]+(?:\.\d{1,2})?)/i)
  return match ? Number(match[1].replaceAll(',', '')) : ''
}

function inferCategory(text) {
  const lower = text.toLowerCase()
  if (/hotel|stay|room/.test(lower)) return 'accommodation'
  if (/flight|uber|taxi|travel|airport/.test(lower)) return 'travel'
  if (/meal|food|cafe|restaurant/.test(lower)) return 'food'
  if (/software|license|subscription/.test(lower)) return 'software'
  if (/paper|supply|stationery/.test(lower)) return 'supplies'
  return 'misc'
}

export function parseExpenseFromText(text) {
  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  return {
    description: firstLine || 'Imported from receipt OCR',
    expenseDate: parseDateCandidate(text),
    amount: parseAmountCandidate(text),
    category: inferCategory(text),
  }
}

export async function scanReceipt(file, onProgress) {
  if (file.type === 'application/pdf') {
    return {
      text: `Demo OCR preview for ${file.name}\nReview the extracted fields before applying them.`,
      confidence: 58,
      parsedFields: {
        description: file.name.replace(/\.[^.]+$/, '').replaceAll('-', ' '),
        category: 'misc',
      },
    }
  }

  try {
    const Tesseract = await import('tesseract.js')
    const result = await Tesseract.recognize(file, 'eng', {
      logger: (message) => {
        if (message.status === 'recognizing text') {
          onProgress(Math.round(message.progress * 100))
        }
      },
    })

    const text = result.data.text
    const confidence = result.data.confidence
    const parsedFields = parseExpenseFromText(text)

    return { text, confidence, parsedFields }
  } catch {
    const fallbackText = `OCR demo fallback for ${file.name}\nNo live OCR engine was available, so fields were guessed from the filename.`
    return {
      text: fallbackText,
      confidence: 44,
      parsedFields: {
        description: file.name.replace(/\.[^.]+$/, '').replaceAll('-', ' '),
        category: 'misc',
      },
    }
  }
}
