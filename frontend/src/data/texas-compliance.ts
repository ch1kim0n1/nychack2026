export type DataQuality = 'real' | 'placeholder'
export type ItemType = 'license' | 'permit' | 'registration' | 'tax' | 'inspection'

export interface ComplianceItem {
  name: string
  agency: string
  type: ItemType
  estimatedTime?: string
  estimatedCost?: string
  notes?: string
}

export interface AgencyContact {
  name: string
  role: string
  phone?: string
  website?: string
}

export interface CityCompliance {
  id: string
  name: string
  dataQuality: DataQuality
  tagline: string
  svgX: number
  svgY: number
  licenses: ComplianceItem[]
  restrictions: string[]
  documents: string[]
  agencies: AgencyContact[]
  watchOut: string[]
}

export const CITIES: CityCompliance[] = [
  {
    id: 'austin',
    name: 'Austin',
    dataQuality: 'real',
    tagline: 'City of Austin — Travis County',
    svgX: 379,
    svgY: 292,
    licenses: [
      {
        name: 'Business Entity Registration',
        agency: 'TX Secretary of State',
        type: 'registration',
        estimatedTime: '1–3 business days',
        estimatedCost: '$300 (LLC)',
        notes: 'Required before applying for any city permits',
      },
      {
        name: 'Sales & Use Tax Permit',
        agency: 'TX Comptroller of Public Accounts',
        type: 'tax',
        estimatedTime: '2–3 weeks',
        estimatedCost: 'Free',
      },
      {
        name: 'Certificate of Occupancy',
        agency: 'City of Austin — Development Services',
        type: 'permit',
        estimatedTime: '4–8 weeks',
        estimatedCost: 'Varies by sq ft',
        notes: 'Required before opening to the public',
      },
      {
        name: 'Food Establishment Permit',
        agency: 'Austin Environmental Health Services',
        type: 'permit',
        estimatedTime: '2–4 weeks',
        estimatedCost: '$258–$771 depending on type',
        notes: 'Annual renewal required',
      },
      {
        name: 'Health Inspection Clearance',
        agency: 'Austin Public Health',
        type: 'inspection',
        estimatedTime: 'Scheduled after permit application',
        notes: 'Must pass before serving food to public',
      },
      {
        name: 'Mixed Beverage Permit (MB)',
        agency: 'TX Alcoholic Beverage Commission (TABC)',
        type: 'license',
        estimatedTime: '50–60 days',
        estimatedCost: '$3,870/year (base fee)',
        notes: 'Required for beer garden / alcohol service',
      },
      {
        name: 'Sign Permit',
        agency: 'City of Austin — Development Services',
        type: 'permit',
        estimatedTime: '1–2 weeks',
        estimatedCost: 'Varies by sign type',
      },
      {
        name: 'Outdoor Dining / Beer Garden Permit',
        agency: 'City of Austin — Transportation Dept.',
        type: 'permit',
        estimatedTime: '3–6 weeks',
        estimatedCost: '$150–$400/year',
        notes: 'Required for sidewalk or patio seating on public right-of-way',
      },
    ],
    restrictions: [
      'Commercial or food-service zoning required — verify with Austin Development Services before signing a lease',
      'Beer gardens require both a TABC Mixed Beverage permit and a City Outdoor Dining permit',
      'Health inspection must be passed before the first day of food service',
      'Austin Music Venue designation may impose additional sound ordinance requirements',
      'Outdoor live music requires a noise ordinance waiver in certain districts',
    ],
    documents: [
      'Signed commercial lease or proof of property ownership',
      'TX SoS Certificate of Formation or filing evidence',
      'Floor plan showing kitchen layout, seating capacity, and exit points',
      'Texas Food Manager Certification for at least one manager on-site',
      'TABC application with entity documents and financial disclosures',
      'Zoning verification letter from Austin Development Services',
      'Certificate of Occupancy application with building plans (if renovating)',
    ],
    agencies: [
      {
        name: 'Austin Development Services',
        role: 'Building permits, Certificate of Occupancy, zoning verification',
        phone: '512-978-4000',
        website: 'https://www.austintexas.gov/department/development-services',
      },
      {
        name: 'Austin Environmental Health Services',
        role: 'Food establishment permits and inspections',
        phone: '512-978-0300',
        website: 'https://www.austintexas.gov/department/environmental-health-services',
      },
      {
        name: 'TX Alcoholic Beverage Commission (TABC)',
        role: 'Alcohol licensing for all Texas locations',
        phone: '512-206-3333',
        website: 'https://www.tabc.texas.gov',
      },
      {
        name: 'TX Secretary of State',
        role: 'Business entity formation and registration',
        phone: '512-463-5555',
        website: 'https://www.sos.texas.gov',
      },
    ],
    watchOut: [
      'Austin zoning approval can take 4–8 weeks — start this first, before any other permits',
      'TABC MB license takes 50–60 days minimum — apply at least 2 months before your target open date',
      'Renovations that trigger a new CO inspection reset your timeline significantly',
      'Some Austin historic districts require an additional design review before permit issuance',
    ],
  },
  {
    id: 'dallas',
    name: 'Dallas',
    dataQuality: 'real',
    tagline: 'City of Dallas — Dallas County',
    svgX: 428,
    svgY: 168,
    licenses: [
      {
        name: 'Business Entity Registration',
        agency: 'TX Secretary of State',
        type: 'registration',
        estimatedTime: '1–3 business days',
        estimatedCost: '$300 (LLC)',
      },
      {
        name: 'Sales & Use Tax Permit',
        agency: 'TX Comptroller of Public Accounts',
        type: 'tax',
        estimatedTime: '2–3 weeks',
        estimatedCost: 'Free',
      },
      {
        name: 'Certificate of Occupancy',
        agency: 'City of Dallas — Development Services',
        type: 'permit',
        estimatedTime: '3–6 weeks',
        estimatedCost: 'Varies by sq ft and use type',
        notes: 'Use-type change (retail → restaurant) triggers full plan review',
      },
      {
        name: 'Food Establishment License',
        agency: 'Dallas Environmental Health Services',
        type: 'license',
        estimatedTime: '2–3 weeks',
        estimatedCost: '$100–$700 depending on establishment type',
        notes: 'Annual renewal; late renewal incurs penalty',
      },
      {
        name: 'Health Inspection',
        agency: 'Dallas Code Compliance',
        type: 'inspection',
        notes: 'Unannounced inspections after opening; violation history affects license renewal',
      },
      {
        name: 'Mixed Beverage Permit (MB)',
        agency: 'TX Alcoholic Beverage Commission (TABC)',
        type: 'license',
        estimatedTime: '50–60 days',
        estimatedCost: '$3,870/year (base fee)',
      },
      {
        name: 'Sign Permit',
        agency: 'City of Dallas — Sustainable Development',
        type: 'permit',
        estimatedTime: '1–3 weeks',
      },
      {
        name: 'Environmental / Grease Trap Permit',
        agency: 'Dallas Sustainable Development & Construction',
        type: 'permit',
        notes: 'Required for commercial kitchens with grease-producing equipment',
      },
    ],
    restrictions: [
      'Dallas zoning districts differ significantly from Austin — verify Commercial Retail (CR) or Commercial Restaurant (CA) designation for your address',
      'Outdoor seating on a public sidewalk requires a Right-of-Way Use Agreement with the City',
      'Annual health inspections by Dallas Code Compliance — violations are publicly recorded',
      'Grease trap installation is required and inspected for all food service establishments',
      'Dallas fire marshal sign-off required as part of the Certificate of Occupancy process',
    ],
    documents: [
      'Signed commercial lease or deed',
      'TX SoS Certificate of Formation',
      'Floor plan with kitchen equipment layout, fire exits, and ADA compliance markings',
      'Texas Food Manager Certification',
      'TABC application with entity documents',
      'Grease trap installation approval (if applicable)',
      'Dallas Building Inspection application for Certificate of Occupancy',
    ],
    agencies: [
      {
        name: 'Dallas Development Services',
        role: 'Building permits, zoning, plan review',
        phone: '214-948-4480',
        website: 'https://dallascityhall.com/departments/sustainabledev',
      },
      {
        name: 'Dallas Environmental Health Services',
        role: 'Food establishment licensing and permits',
        phone: '214-670-8083',
        website: 'https://dallascityhall.com/departments/codecompliance',
      },
      {
        name: 'Dallas Code Compliance',
        role: 'Health inspections, code enforcement, complaints',
        phone: '214-670-5111',
        website: 'https://dallascityhall.com/departments/codecompliance',
      },
      {
        name: 'TX Alcoholic Beverage Commission (TABC)',
        role: 'Alcohol licensing',
        phone: '512-206-3333',
        website: 'https://www.tabc.texas.gov',
      },
    ],
    watchOut: [
      'Dallas Code Compliance inspectors are strict — documented violations can complicate license renewal',
      'Some Dallas government portals have known technical issues; file in person if online submission fails',
      'Use-type change (e.g., retail → restaurant) triggers a full plan review, adding 4–8 weeks',
      'Industrial/commercial mixed zones (MF-2, CA-1) require additional zoning review before the CO',
    ],
  },
  {
    id: 'houston',
    name: 'Houston',
    dataQuality: 'placeholder',
    tagline: 'City of Houston — Harris County',
    svgX: 481,
    svgY: 316,
    licenses: [
      {
        name: 'Business Entity Registration',
        agency: 'TX Secretary of State',
        type: 'registration',
        estimatedCost: '$300 (LLC)',
      },
      {
        name: 'Sales & Use Tax Permit',
        agency: 'TX Comptroller',
        type: 'tax',
        estimatedCost: 'Free',
      },
      {
        name: 'Certificate of Occupancy Assistance (COA)',
        agency: 'City of Houston — Permitting Center',
        type: 'permit',
        estimatedTime: '3–6 weeks',
      },
      {
        name: 'Food Establishment Permit',
        agency: 'Houston Health Department',
        type: 'permit',
        estimatedCost: '$180–$680 by type',
        notes: 'Types 1–4 based on establishment complexity',
      },
      {
        name: 'Health Inspection',
        agency: 'Houston Health Dept. Environmental Health',
        type: 'inspection',
      },
      {
        name: 'Mixed Beverage Permit (MB)',
        agency: 'TX Alcoholic Beverage Commission (TABC)',
        type: 'license',
        estimatedTime: '50–60 days',
        estimatedCost: '$3,870/year',
      },
    ],
    restrictions: [
      'Houston has NO city zoning ordinances (unique among major US cities) — but deed restrictions on the property are legally enforceable',
      'Check deed restrictions before signing a lease — they can prohibit food service, alcohol, or specific signage',
      'Harris County health requirements apply in addition to city permits for some establishment types',
      'Houston fire code requires annual fire safety inspections for all food service businesses',
    ],
    documents: [
      'Signed commercial lease (review deed restrictions carefully before signing)',
      'TX SoS Certificate of Formation',
      'Floor plan and equipment layout',
      'Texas Food Manager Certification',
      'TABC application documents',
      'Fire safety inspection approval',
    ],
    agencies: [
      {
        name: 'Houston Permitting Center',
        role: 'One-stop shop for building permits and COA',
        phone: '832-394-8800',
      },
      {
        name: 'Houston Health Department',
        role: 'Food establishment permits and inspections',
        phone: '832-393-5100',
      },
      {
        name: 'TX Alcoholic Beverage Commission (TABC)',
        role: 'Alcohol licensing',
        phone: '512-206-3333',
        website: 'https://www.tabc.texas.gov',
      },
    ],
    watchOut: [
      'No zoning does NOT mean no rules — deed restrictions are private law and can be strictly enforced by property owners',
      'Some Harris County properties outside Houston city limits require county permits instead of city permits — confirm your address jurisdiction first',
      'The Houston Permitting Center is a one-stop shop — call them first to get a full permit checklist for your address',
    ],
  },
  {
    id: 'san-antonio',
    name: 'San Antonio',
    dataQuality: 'placeholder',
    tagline: 'City of San Antonio — Bexar County',
    svgX: 347,
    svgY: 332,
    licenses: [
      {
        name: 'Business Entity Registration',
        agency: 'TX Secretary of State',
        type: 'registration',
        estimatedCost: '$300 (LLC)',
      },
      {
        name: 'Sales & Use Tax Permit',
        agency: 'TX Comptroller',
        type: 'tax',
        estimatedCost: 'Free',
      },
      {
        name: 'Certificate of Occupancy',
        agency: 'City of San Antonio — Development Services',
        type: 'permit',
        estimatedTime: '3–5 weeks',
      },
      {
        name: 'Food Establishment Permit',
        agency: 'San Antonio Metropolitan Health District',
        type: 'permit',
        estimatedCost: '$100–$600',
        notes: 'Annual renewal required',
      },
      {
        name: 'Health Inspection',
        agency: 'San Antonio Metro Health',
        type: 'inspection',
      },
      {
        name: 'Mixed Beverage Permit (MB)',
        agency: 'TX Alcoholic Beverage Commission (TABC)',
        type: 'license',
        estimatedTime: '50–60 days',
        estimatedCost: '$3,870/year',
      },
      {
        name: 'Business Personal Property Tax Registration',
        agency: 'Bexar County Appraisal District',
        type: 'registration',
      },
    ],
    restrictions: [
      'Bexar County health inspection is required separately from the city permit in some areas',
      'River Walk area and historic districts have additional permitting layers and a design review process',
      'Outdoor seating near the River Walk requires City Tourism and River Walk authority approval',
      'SA Tomorrow Comprehensive Plan affects zoning — verify restaurant or food-service use compatibility for your address',
    ],
    documents: [
      'Signed lease or deed',
      'TX SoS Certificate of Formation',
      'Floor plan with seating and kitchen layout',
      'Texas Food Manager Certification',
      'TABC application documents',
      'Bexar CAD personal property registration',
    ],
    agencies: [
      {
        name: 'San Antonio Development Services',
        role: 'Building permits, zoning, Certificate of Occupancy',
        phone: '210-207-1111',
      },
      {
        name: 'San Antonio Metro Health',
        role: 'Food permits and health inspections',
        phone: '210-207-8853',
      },
      {
        name: 'TX Alcoholic Beverage Commission (TABC)',
        role: 'Alcohol licensing',
        phone: '512-206-3333',
        website: 'https://www.tabc.texas.gov',
      },
    ],
    watchOut: [
      'River Walk and historic district businesses face additional review layers that can add 4–6 weeks to your timeline',
      'Bexar County and City of SA permits are separate systems — you may need both depending on your address',
      'SA Tourism authority has a separate approval process for outdoor commercial use near the River Walk',
    ],
  },
  {
    id: 'fort-worth',
    name: 'Fort Worth',
    dataQuality: 'placeholder',
    tagline: 'City of Fort Worth — Tarrant County',
    svgX: 395,
    svgY: 188,
    licenses: [
      {
        name: 'Business Entity Registration',
        agency: 'TX Secretary of State',
        type: 'registration',
        estimatedCost: '$300 (LLC)',
      },
      {
        name: 'Sales & Use Tax Permit',
        agency: 'TX Comptroller',
        type: 'tax',
        estimatedCost: 'Free',
      },
      {
        name: 'Certificate of Occupancy',
        agency: 'City of Fort Worth — Development Services',
        type: 'permit',
        estimatedTime: '2–5 weeks',
      },
      {
        name: 'Food Establishment Permit',
        agency: 'Fort Worth Public Health',
        type: 'permit',
        estimatedCost: '$100–$500',
      },
      {
        name: 'Health Inspection',
        agency: 'Fort Worth Environmental Health',
        type: 'inspection',
      },
      {
        name: 'Mixed Beverage Permit (MB)',
        agency: 'TX Alcoholic Beverage Commission (TABC)',
        type: 'license',
        estimatedTime: '50–60 days',
        estimatedCost: '$3,870/year',
      },
      {
        name: 'Tarrant County Permits',
        agency: 'Tarrant County',
        type: 'permit',
        notes: 'Required for locations outside Fort Worth city limits but within Tarrant County',
      },
    ],
    restrictions: [
      'Fort Worth has stricter signage regulations in historic districts such as the Stockyards and Sundance Square area',
      'Tarrant County and City of Fort Worth permits are separate if the business is in unincorporated county territory',
      'Outdoor seating in entertainment districts requires coordination with the Downtown Fort Worth management zone',
      'Fort Worth fire code requires fire suppression systems in all commercial kitchens',
    ],
    documents: [
      'Signed lease or deed',
      'TX SoS Certificate of Formation',
      'Floor plan and equipment layout',
      'Texas Food Manager Certification',
      'TABC application documents',
      'Fire suppression system plan (for commercial kitchens)',
    ],
    agencies: [
      {
        name: 'Fort Worth Development Services',
        role: 'Building permits, zoning, Certificate of Occupancy',
        phone: '817-392-8000',
      },
      {
        name: 'Fort Worth Public Health',
        role: 'Food permits and health inspections',
        phone: '817-392-7200',
      },
      {
        name: 'TX Alcoholic Beverage Commission (TABC)',
        role: 'Alcohol licensing',
        phone: '512-206-3333',
        website: 'https://www.tabc.texas.gov',
      },
    ],
    watchOut: [
      'The Stockyards historic district has strict signage and facade rules — verify requirements before committing to a location',
      'Fort Worth and Tarrant County permits are separate systems — confirm which applies to your specific address',
      'Downtown FW and Sundance Square have management zones with additional approval steps for any outdoor commercial use',
    ],
  },
  {
    id: 'el-paso',
    name: 'El Paso',
    dataQuality: 'placeholder',
    tagline: 'City of El Paso — El Paso County',
    svgX: 22,
    svgY: 222,
    licenses: [
      {
        name: 'Business Entity Registration',
        agency: 'TX Secretary of State',
        type: 'registration',
        estimatedCost: '$300 (LLC)',
      },
      {
        name: 'Sales & Use Tax Permit',
        agency: 'TX Comptroller',
        type: 'tax',
        estimatedCost: 'Free',
      },
      {
        name: 'Certificate of Occupancy',
        agency: 'City of El Paso — Building & Development',
        type: 'permit',
        estimatedTime: '3–5 weeks',
      },
      {
        name: 'Food Establishment Permit',
        agency: 'El Paso Environmental Services',
        type: 'permit',
        estimatedCost: '$150–$600',
      },
      {
        name: 'Health Inspection',
        agency: 'El Paso Dept. of Public Health',
        type: 'inspection',
      },
      {
        name: 'Mixed Beverage Permit (MB)',
        agency: 'TX Alcoholic Beverage Commission (TABC)',
        type: 'license',
        estimatedTime: '50–60 days',
        estimatedCost: '$3,870/year',
      },
    ],
    restrictions: [
      'Proximity to the US-Mexico international boundary creates unique import/export and goods-movement compliance requirements',
      'Some El Paso locations fall under special international bridge zone regulations',
      'El Paso County permits are required for businesses outside city limits but within the county',
      'Cross-border supply chain businesses may need a US Customs and Border Protection compliance layer on top of state permits',
    ],
    documents: [
      'Signed lease or deed',
      'TX SoS Certificate of Formation',
      'Floor plan and equipment layout',
      'Texas Food Manager Certification',
      'TABC application documents',
      'CBP registration (if importing goods across the US-Mexico border)',
    ],
    agencies: [
      {
        name: 'El Paso Building & Development',
        role: 'Building permits, zoning, Certificate of Occupancy',
        phone: '915-212-0088',
      },
      {
        name: 'El Paso Environmental Services',
        role: 'Food permits and health inspections',
        phone: '915-212-6700',
      },
      {
        name: 'TX Alcoholic Beverage Commission (TABC)',
        role: 'Alcohol licensing',
        phone: '512-206-3333',
        website: 'https://www.tabc.texas.gov',
      },
    ],
    watchOut: [
      'International boundary proximity can add federal compliance layers not present in other Texas cities — verify early',
      'El Paso city and county permit systems are separate — confirm which jurisdiction governs your specific address',
      'Some food ingredients imported from Mexico require CBP inspection clearance — check if this applies to your supply chain',
    ],
  },
]
