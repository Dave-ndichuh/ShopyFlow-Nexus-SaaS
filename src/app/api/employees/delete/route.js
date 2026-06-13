import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

    // 1. Get the mapping in the users table to find the auth.users.id
    const { data: userRef } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('EMPLOYEE_ID', id)
      .maybeSingle();

    // 2. If it exists in the users mapping table, delete the Supabase Auth user
    // (This might automatically cascade to the users table depending on your triggers, 
    // but we will explicitly delete from users next just in case).
    if (userRef && userRef.id) {
      await supabaseAdmin.auth.admin.deleteUser(userRef.id);
    }

    // 3. Delete from the users table explicitly to clear the foreign key constraint
    await supabaseAdmin.from('users').delete().eq('EMPLOYEE_ID', id);

    // 4. Finally, delete the employee record
    const { error: delError } = await supabaseAdmin.from('employee').delete().eq('EMPLOYEE_ID', id);
    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
