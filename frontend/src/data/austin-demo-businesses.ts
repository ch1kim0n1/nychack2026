export interface AustinDemoBusiness {
  id: string
  name: string
  category: string
  address: string
  neighborhood: string
  blurb: string
  coordinates: [number, number]
  googleMapsQuery: string
  scanSummary: string
  generatedInput: string
}

export const AUSTIN_DEMO_BUSINESSES: AustinDemoBusiness[] = [
  {
    id: 'radio-coffee-beer',
    name: 'Radio Coffee & Beer',
    category: 'Coffee bar, beer garden, food trailers',
    address: '4204 Menchaca Rd, Austin, TX 78704',
    neighborhood: 'South Austin',
    blurb: 'Established Austin coffee-and-beer concept with outdoor seating, food service, and alcohol operations.',
    coordinates: [-97.769978, 30.229969],
    googleMapsQuery: 'Radio Coffee and Beer Austin TX',
    scanSummary: 'Selected on Austin business map: Radio Coffee & Beer in South Austin, an established coffee bar and beer garden with outdoor seating and food service.',
    generatedInput: 'Analyze an established Austin business. Radio Coffee & Beer is a coffee bar, beer garden, and food-trailer venue in South Austin at 4204 Menchaca Rd, Austin, TX 78704. It operates food service with outdoor seating and alcohol service.',
  },
  {
    id: 'lazarus-brewing',
    name: 'Lazarus Brewing Co.',
    category: 'Brewery, taproom, kitchen',
    address: '1902 E 6th St, Austin, TX 78702',
    neighborhood: 'East Austin',
    blurb: 'Austin brewery and taproom with on-site food service, alcohol sales, and high-foot-traffic patio operations.',
    coordinates: [-97.723498, 30.262649],
    googleMapsQuery: 'Lazarus Brewing Co Austin TX',
    scanSummary: 'Selected on Austin business map: Lazarus Brewing Co. in East Austin, an established brewery and taproom with kitchen service and patio operations.',
    generatedInput: 'Analyze an established Austin business. Lazarus Brewing Co. is a brewery, taproom, and kitchen in East Austin at 1902 E 6th St, Austin, TX 78702. It operates food preparation, alcohol service, and patio seating.',
  },
  {
    id: 'better-half',
    name: 'Better Half Coffee & Cocktails',
    category: 'Cafe, cocktails, patio dining',
    address: '406 Walsh St, Austin, TX 78703',
    neighborhood: 'Clarksville',
    blurb: 'Established all-day Austin cafe with alcohol service, patio dining, and strong neighborhood foot traffic.',
    coordinates: [-97.760422, 30.270634],
    googleMapsQuery: 'Better Half Coffee and Cocktails Austin TX',
    scanSummary: 'Selected on Austin business map: Better Half Coffee & Cocktails in Clarksville, an established cafe with cocktails and patio dining.',
    generatedInput: 'Analyze an established Austin business. Better Half Coffee & Cocktails is an all-day cafe and cocktail bar in Clarksville at 406 Walsh St, Austin, TX 78703. It runs food service, alcohol service, patio dining, and likely takeout or delivery operations.',
  },
  {
    id: 'franklin-barbecue',
    name: 'Franklin Barbecue',
    category: 'Barbecue restaurant',
    address: '900 E 11th St, Austin, TX 78702',
    neighborhood: 'Central East Austin',
    blurb: 'Established Austin barbecue restaurant with high-volume food preparation and queue-heavy customer operations.',
    coordinates: [-97.731547, 30.269967],
    googleMapsQuery: 'Franklin Barbecue Austin TX',
    scanSummary: 'Selected on Austin business map: Franklin Barbecue in East Austin, an established barbecue restaurant with high-volume food preparation.',
    generatedInput: 'Analyze an established Austin business. Franklin Barbecue is a barbecue restaurant in Central East Austin at 900 E 11th St, Austin, TX 78702. It operates a high-volume food preparation business with on-site service.',
  },
]
