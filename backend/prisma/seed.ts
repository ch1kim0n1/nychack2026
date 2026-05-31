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
      source_url: 'https://www.austintexas.gov/department/food-enterprise-permits',
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
      source_url:
        'https://www.tabc.texas.gov/licenses-permits/license-permit-types/mixed-beverage-permit/',
    },
    {
      id: 'finding-003',
      business_id: business.id,
      risk_level: 'high',
      affected_area: 'Austin Zoning – Outdoor Service',
      explanation:
        'A beer garden with outdoor seating requires CS (Commercial Services) or MU (Mixed Use) zoning. Verify the property zoning before signing a lease — incorrect zoning cannot be resolved after the fact.',
      recommended_action:
        'Use the Austin zoning lookup at austintexas.gov/page/zoning before committing to a location.',
      source_url: 'https://www.austintexas.gov/page/zoning',
    },
    {
      id: 'finding-004',
      business_id: business.id,
      risk_level: 'medium',
      affected_area: 'Austin Commercial Building Permit',
      explanation:
        'Any interior build-out or renovation for the new restaurant requires a Commercial Building Permit from Austin Development Services. A fire marshal inspection is required before opening.',
      recommended_action:
        'Submit your building permit application at austintexas.gov/department/building-permits. Budget 4–8 weeks for approval.',
      source_url: 'https://www.austintexas.gov/department/building-permits',
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
    },
  ];

  for (const finding of findingsData) {
    await prisma.riskFinding.upsert({
      where: { id: finding.id },
      update: {},
      create: finding,
    });
  }

  console.log(`✓ Seeded business: ${business.id}`);
  console.log(`✓ Seeded ${findingsData.length} risk findings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
