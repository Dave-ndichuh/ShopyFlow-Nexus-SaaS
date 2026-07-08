import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.json();
    const { user_id, business_name, industry } = body;

    if (!user_id || !business_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Generate a Clean, Unique Slug
    let baseSlug = business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!baseSlug) baseSlug = 'workspace';
    
    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const { data: existing } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
        
      if (existing) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      } else {
        isUnique = true;
      }
    }
    // Set up terminology based on industry
    let terminology = { contacts: 'Contacts', catalog: 'Catalog', orders: 'Orders', vendors: 'Vendors', pos: 'Sales / POS' };
    if (industry === 'Healthcare') {
      terminology = { contacts: 'Patients', catalog: 'Services', orders: 'Visits', vendors: 'Suppliers', pos: 'Check-in' };
    } else if (industry === 'Auto Repair') {
      terminology = { contacts: 'Customers', catalog: 'Parts', orders: 'Job Cards', vendors: 'Suppliers', pos: 'Service Bay' };
    } else if (industry === 'Retail') {
      terminology = { contacts: 'Customers', catalog: 'Products', orders: 'Sales', vendors: 'Suppliers', pos: 'POS Terminal' };
    }

    const selectedPlanId = 'unlimited';
    const subStatus = 'active';

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert([{ 
        name: business_name, 
        slug, 
        industry: industry || 'Generic',
        terminology,
        plan_id: selectedPlanId,
        subscription_status: subStatus
      }])
      .select()
      .single();

    if (tenantError) throw new Error('Tenant creation failed: ' + tenantError.message);

    // 2. Ensure Global Roles Exist & Get Owner Role ID
    // Check if Owner role exists globally (tenant_id IS NULL)
    let { data: ownerRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .is('tenant_id', null)
      .eq('name', 'Owner')
      .single();

    if (!ownerRole) {
      // Create global roles if they don't exist
      const rolesToInsert = [
        { name: 'Owner', description: 'Full access to all tenant features.', is_system_role: true },
        { name: 'Manager', description: 'Can manage daily operations but cannot change billing.', is_system_role: true },
        { name: 'Cashier', description: 'Can only process POS transactions and view assigned branches.', is_system_role: true }
      ];
      
      const { data: createdRoles, error: rolesError } = await supabaseAdmin
        .from('roles')
        .insert(rolesToInsert)
        .select();
        
      if (rolesError) throw new Error('Failed to create global roles: ' + rolesError.message);
      ownerRole = createdRoles.find(r => r.name === 'Owner');
    }

    // 3. Link User to Tenant as Owner
    const { error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .insert([{
        user_id: user_id,
        tenant_id: tenant.id,
        role_id: ownerRole.id,
        status: 'active'
      }]);

    if (membershipError) throw new Error('Membership creation failed: ' + membershipError.message);

    // 4. Create Main Branch
    const { error: branchError } = await supabaseAdmin
      .from('branches')
      .insert([{
        tenant_id: tenant.id,
        name: 'Main Branch',
        code: 'MAIN-01',
        is_active: true
      }]);

    if (branchError) throw new Error('Branch creation failed: ' + branchError.message);

    return NextResponse.json({ success: true, tenant_id: tenant.id, slug: tenant.slug, message: 'Workspace created successfully!' });

  } catch (error) {
    console.error('Provisioning Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
