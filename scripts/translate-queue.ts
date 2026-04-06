import fs from 'fs'

const QUEUE_FILE = 'data/translation-queue.json'
const OUTPUT_FILE = 'data/translations-generated.json'
const delayMs = 300

const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'))
let generated: Record<string, any> = {}

if (fs.existsSync(OUTPUT_FILE)) {
  try {
    generated = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
  } catch (e) { }
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

function fixProperNouns(text: string, lang: string) {
  if (!text) return text
  return text
}

async function doTranslate(text: string, to: string) {
  if (!text || text.trim() === '') return ''
  
  if (text === 'Südwestkirchhof Stahnsdorf') {
     if (to === 'pl') return 'Cmentarz Południowo-Zachodni w Stahnsdorfie'
     if (to === 'ru') return 'Юго-западное кладбище (Штансдорф)'
     if (to === 'sv') return 'Sydvästra kyrkogården i Stahnsdorf'
  }
  
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
  
  try {
    const res = await fetch(url)
    const json = await res.json()
    // json[0] contains array of sentences, json[0][i][0] is the translated string
    const translatedText = json[0].map((item: any) => item[0]).join('')
    return fixProperNouns(translatedText, to)
  } catch (e) {
    console.error(`Error translating to ${to}:`, e)
    return text
  }
}

async function run() {
  const keys = Object.keys(queue)
  console.log(`Resuming translation with Google API (Native) for ${keys.length} items...`)
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (!generated[key]) generated[key] = {}
    
    const obj = queue[key]
    const fields = ['name', 'kurztext', 'beschreibung']
    
    let updated = false
    
    for (const field of fields) {
      if (!obj[field]) continue
      if (!generated[key][field]) generated[key][field] = {}
      
      const langs = ['pl', 'ru', 'sv']
      for (const lang of langs) {
        if (!generated[key][field][lang] || generated[key][field][lang] === obj[field]) {
          process.stdout.write(`Translating ${key}.${field} -> ${lang}... `)
          const result = await doTranslate(obj[field], lang)
          generated[key][field][lang] = result
          updated = true
          await delay(delayMs)
          console.log(`OK`)
        }
      }
    }
    
    if (updated) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(generated, null, 2))
    }
  }
  
  console.log("Translation complete.")
}

run().catch(console.error)
