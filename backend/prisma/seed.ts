import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Scenario A demo data...');

  const business = await prisma.business.upsert({
    where: { id: 'demo-biz-scenario-a' },
    update: {},
    create: {
      id: 'demo-biz-scenario-a',
      name: 'Demo: Food Truck → Austin Restaurant',
      city: 'Dallas',
      state: 'TX',
      industry_code: 'food_service',
      activities: ['food_preparation', 'alcohol_planned', 'outdoor_seating'],
      expansion_plans: { locations: ['Austin, TX'] },
    },
  });

  const findingsData = [
    {
      id: 'finding-001',
      business_id: business.id,
      risk_level: 'high',
      affected_area: 'Austin Food Enterprise Permit',
      explanation:
        'Opening a restaurant in Austin requires a Food Enterprise Permit from Austin Public Health. A pre-opening health inspection must be passed before serving customers.',
      recommended_action:
        'Apply online at austintexas.gov/department/food-enterprise-permits at least 30 days before your planned opening date.',
      source_url: 'https://www.austintexas.gov/health/programs/fixed-food-establishments',
      // impact
      money_risk: 'medium', delay_risk: 'high', legal_severity: 'high', urgency: 'immediate',
      impact_score: 85, impact_label: 'Could delay opening',
      // playbook
      who_to_contact: 'Austin Public Health',
      what_to_ask: 'What documents do I need for a Food Enterprise Permit, and how long does the pre-opening inspection take to schedule?',
      documents_needed: ['Floor plan', 'Menu', 'Proof of food manager certification', 'Lease or property deed'],
      next_steps: ['Submit application online', 'Schedule pre-opening inspection', 'Pass inspection before opening day'],
      // intelligence
      prerequisites: [],
      is_hidden_requirement: false,
      response_path: 'contact_agency',
      // stakeholder + cost
      permit_fee: '~$600/year', effective_date: 'Before opening day',
      agency_department: 'Environmental Health Services Division',
      agency_url: 'https://www.austintexas.gov/health/programs/fixed-food-establishments',
      // trust
      confidence_level: 'high', jurisdiction_level: 'city',
    },
    {
      id: 'finding-002',
      business_id: business.id,
      risk_level: 'high',
      affected_area: 'TABC Mixed Beverage Permit',
      explanation:
        'A beer garden requires a TABC Mixed Beverage Permit. The permit costs approximately $3,000/year. All servers must hold a TABC seller/server certification before serving alcohol.',
      recommended_action:
        'Apply at tabc.texas.gov/licenses-permits. Enroll servers in a TABC-approved certification course before opening.',
      source_url: 'https://www.tabc.texas.gov/services/tabc-licenses-permits/',
      money_risk: 'high', delay_risk: 'high', legal_severity: 'high', urgency: 'immediate',
      impact_score: 90, impact_label: 'Could trigger fine',
      who_to_contact: 'Texas Alcoholic Beverage Commission (TABC)',
      what_to_ask: 'Which permit tier applies to a beer garden with outdoor service, and how long is the approval timeline?',
      documents_needed: ['Certificate of occupancy', 'Zoning verification', 'Business entity registration', 'Server certifications'],
      next_steps: ['Confirm zoning allows alcohol service', 'Apply for Mixed Beverage Permit', 'Certify all servers', 'Post permit on premises'],
      prerequisites: ['Austin Zoning – Outdoor Service approval', 'Certificate of occupancy'],
      is_hidden_requirement: false,
      response_path: 'contact_agency',
      permit_fee: '~$3,000/year', effective_date: 'Before serving alcohol',
      agency_department: 'Licensing Division',
      agency_url: 'https://www.tabc.texas.gov/services/tabc-licenses-permits/',
      confidence_level: 'high', jurisdiction_level: 'state',
    },
    {
      id: 'finding-003',
      business_id: business.id,
      risk_level: 'high',
      affected_area: 'Austin Zoning – Outdoor Service',
      explanation:
        'A beer garden with outdoor seating requires CS (Commercial Services) or MU (Mixed Use) zoning. Verify the property zoning before signing a lease — incorrect zoning cannot be resolved after the fact.',
      recommended_action:
        'Use the Austin zoning lookup before committing to a location, and confirm outdoor-service is permitted at the address.',
      source_url: 'https://www.austintexas.gov/development-services/zoning-verification',
      money_risk: 'high', delay_risk: 'high', legal_severity: 'medium', urgency: 'immediate',
      impact_score: 88, impact_label: 'Must verify before lease',
      who_to_contact: 'Austin Development Services Department',
      what_to_ask: 'Is the property at my target address zoned CS or MU, and does it allow a beer garden with outdoor seating?',
      documents_needed: ['Property address', 'Site plan'],
      next_steps: ['Run zoning lookup for the address', 'Confirm outdoor-service allowance', 'Only then sign the lease'],
      prerequisites: [],
      is_hidden_requirement: true,
      response_path: 'seek_clarification',
      permit_fee: 'No fee (verification)', effective_date: 'Before signing lease',
      agency_department: 'Planning & Zoning',
      agency_url: 'https://www.austintexas.gov/development-services/zoning-verification',
      confidence_level: 'high', jurisdiction_level: 'city',
    },
    {
      id: 'finding-004',
      business_id: business.id,
      risk_level: 'medium',
      affected_area: 'Austin Commercial Building Permit',
      explanation:
        'Any interior build-out or renovation for the new restaurant requires a Commercial Building Permit from Austin Development Services. A fire marshal inspection is required before opening.',
      recommended_action:
        'Submit your building permit application early. Budget 4–8 weeks for approval and schedule the fire marshal inspection.',
      source_url: 'https://www.austintexas.gov/development-services/commercial-plan-review',
      money_risk: 'medium', delay_risk: 'high', legal_severity: 'medium', urgency: 'soon',
      impact_score: 60, impact_label: 'Could delay opening',
      who_to_contact: 'Austin Development Services Department',
      what_to_ask: 'What is the current commercial building permit review timeline, and when should I schedule the fire marshal inspection?',
      documents_needed: ['Stamped construction drawings', 'Contractor license', 'Site plan'],
      next_steps: ['Hire licensed contractor', 'Submit stamped drawings', 'Pass fire marshal inspection'],
      prerequisites: ['Austin Zoning – Outdoor Service approval'],
      is_hidden_requirement: false,
      response_path: 'contact_agency',
      permit_fee: 'Varies by project size', effective_date: '4–8 weeks before opening',
      agency_department: 'Building Plan Review',
      agency_url: 'https://www.austintexas.gov/development-services/commercial-plan-review',
      confidence_level: 'medium', jurisdiction_level: 'city',
    },
    {
      id: 'finding-005',
      business_id: business.id,
      risk_level: 'low',
      affected_area: 'Texas Sales Tax Permit',
      explanation:
        'Your existing Texas Sales Tax Permit (issued from Dallas) is valid statewide. No new permit is needed for the Austin location.',
      recommended_action:
        'Update your business address with the Texas Comptroller if your principal place of business changes to Austin.',
      source_url: 'https://comptroller.texas.gov/taxes/sales/',
      money_risk: 'low', delay_risk: 'low', legal_severity: 'low', urgency: 'ongoing',
      impact_score: 15, impact_label: 'Informational',
      who_to_contact: 'Texas Comptroller of Public Accounts',
      what_to_ask: 'Do I need to update my sales tax permit address when adding a second location?',
      documents_needed: ['Existing sales tax permit number'],
      next_steps: ['Update business address online if principal location changes'],
      prerequisites: [],
      is_hidden_requirement: false,
      response_path: 'update_docs',
      permit_fee: 'Free', effective_date: 'Ongoing',
      agency_department: 'Account Maintenance',
      agency_url: 'https://comptroller.texas.gov/taxes/sales/',
      confidence_level: 'high', jurisdiction_level: 'state',
    },
  ];

  for (const finding of findingsData) {
    const { id, ...rest } = finding;
    await prisma.riskFinding.upsert({
      where: { id },
      update: rest, // refresh existing demo rows with enriched fields
      create: finding,
    });
  }

  console.log(`✓ Seeded business: ${business.id}`);
  console.log(`✓ Seeded ${findingsData.length} risk findings (enriched)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
