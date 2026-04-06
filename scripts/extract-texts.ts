import fs from 'fs'

const originalData = JSON.parse(fs.readFileSync('data/stahnsdorf-backup-base.json', 'utf8'))
const queue: Record<string, any> = {}

// Add collections
originalData.collections.forEach((col: any) => {
  queue[`col_${col.id}`] = {
    name: col.name?.de || '',
    beschreibung: col.beschreibung?.de || ''
  }
})

// Add POIs
originalData.pois.forEach((poi: any) => {
  queue[`poi_${poi.id}`] = {
    name: poi.name?.de || '',
    kurztext: poi.kurztext?.de || '',
    beschreibung: poi.beschreibung?.de || ''
  }
})

fs.writeFileSync('data/translation-queue.json', JSON.stringify(queue, null, 2))
console.log(`Extracted texts into data/translation-queue.json`)
