import fs from 'fs'

const originalData = JSON.parse(fs.readFileSync('data/stahnsdorf-backup-base.json', 'utf8'))
const translations = JSON.parse(fs.readFileSync('data/translations-generated.json', 'utf8'))

originalData.collections.forEach((col: any) => {
  const t = translations[`col_${col.id}`]
  if (t) {
    if (!col.name) col.name = {}
    if (!col.beschreibung) col.beschreibung = {}
    
    col.name.pl = t.name?.pl || col.name.pl
    col.name.ru = t.name?.ru || col.name.ru
    col.name.sv = t.name?.sv || col.name.sv
    
    col.beschreibung.pl = t.beschreibung?.pl || col.beschreibung.pl
    col.beschreibung.ru = t.beschreibung?.ru || col.beschreibung.ru
    col.beschreibung.sv = t.beschreibung?.sv || col.beschreibung.sv
  }
})

originalData.pois.forEach((poi: any) => {
  const t = translations[`poi_${poi.id}`]
  if (t) {
    if (!poi.name) poi.name = {}
    if (!poi.kurztext) poi.kurztext = {}
    if (!poi.beschreibung) poi.beschreibung = {}
    
    poi.name.pl = t.name?.pl || poi.name.pl
    poi.name.ru = t.name?.ru || poi.name.ru
    poi.name.sv = t.name?.sv || poi.name.sv
    
    poi.kurztext.pl = t.kurztext?.pl || poi.kurztext.pl
    poi.kurztext.ru = t.kurztext?.ru || poi.kurztext.ru
    poi.kurztext.sv = t.kurztext?.sv || poi.kurztext.sv
    
    poi.beschreibung.pl = t.beschreibung?.pl || poi.beschreibung.pl
    poi.beschreibung.ru = t.beschreibung?.ru || poi.beschreibung.ru
    poi.beschreibung.sv = t.beschreibung?.sv || poi.beschreibung.sv
  }
})

fs.writeFileSync('data/stahnsdorf-backup-translated.json', JSON.stringify(originalData, null, 2))
console.log(`Merged translations into data/stahnsdorf-backup-translated.json`)
