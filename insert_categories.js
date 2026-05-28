const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dyoicvurrhuokfufsrwc.supabase.co';
const supabaseKey = 'sb_publishable_4Xb4nVQw7LhlRU8xfb1jcQ_oMw_4WwB';
const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { CNAME: 'Engine Parts' },
  { CNAME: 'Transmission & Drivetrain' },
  { CNAME: 'Brakes' },
  { CNAME: 'Suspension & Steering' },
  { CNAME: 'Electrical & Ignition' },
  { CNAME: 'Batteries & Charging' },
  { CNAME: 'Filters (Air, Oil, Fuel)' },
  { CNAME: 'Cooling System (Radiators, Hoses)' },
  { CNAME: 'Fuel System (Pumps, Injectors)' },
  { CNAME: 'Exhaust & Emissions' },
  { CNAME: 'Belts & Pulleys' },
  { CNAME: 'Gaskets & Seals' },
  { CNAME: 'Lighting & Bulbs' },
  { CNAME: 'Wheels & Tires' },
  { CNAME: 'Bearings & Bushings' },
  { CNAME: 'Body Panels & Exterior Trim' },
  { CNAME: 'Interior Trim & Accessories' },
  { CNAME: 'HVAC / Air Conditioning' },
  { CNAME: 'Sensors & Electronics' },
  { CNAME: 'Fluids & Lubricants' },
  { CNAME: 'Fasteners & Hardware' },
  { CNAME: 'Braking Consumables (Pads, Rotors)' },
  { CNAME: 'Brake Lines & Hoses' },
  { CNAME: 'Engine Management (ECU, Modules)' },
  { CNAME: 'Tools & Workshop Supplies' }
];

async function insertCategories() {
  console.log('Inserting categories...');
  const { data, error } = await supabase.from('category').insert(categories).select();
  
  if (error) {
    console.error('Error inserting categories:', error);
  } else {
    console.log(`Successfully inserted ${data.length} categories.`);
  }
}

insertCategories();
