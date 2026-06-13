import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.json();
    const { email, password, role_id, branch_ids, tenant_id } = body;

    if (!email || !role_id || !tenant_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create User via Admin API
    // We'll use createUser with email_confirm: true so they can login immediately if we provide a password.
    // If no password is provided, we use inviteUserByEmail.
    let user;
    if (password) {
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Auto-confirm for local development/simplicity
      });
      if (createError) throw createError;
      user = userData.user;
    } else {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
      if (inviteError) throw inviteError;
      user = inviteData.user;
    }

    if (!user) throw new Error("Failed to create user.");

    // 2. Add to tenant_memberships
    const { error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .insert([{
        user_id: user.id,
        tenant_id: tenant_id,
        role_id: role_id,
        status: 'active'
      }]);

    if (membershipError) throw membershipError;

    // 3. Map to specific branches (if any provided)
    if (branch_ids && branch_ids.length > 0) {
      const branchPayloads = branch_ids.map(bId => ({
        user_id: user.id,
        branch_id: bId,
        tenant_id: tenant_id
      }));

      const { error: branchError } = await supabaseAdmin
        .from('user_branches')
        .insert(branchPayloads);

      if (branchError) {
        console.error("Warning: Failed to assign some branches", branchError);
      }
    }

    return NextResponse.json({ success: true, message: 'User invited successfully!', user_id: user.id });

  } catch (error) {
    console.error('Invite Staff Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
