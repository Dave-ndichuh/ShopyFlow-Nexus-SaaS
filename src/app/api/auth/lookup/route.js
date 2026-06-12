import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { username } = await request.json();
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('employee')
      .select('EMAIL')
      .ilike('USERNAME', username.trim())
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid Username or PIN.' }, { status: 404 });
    }

    return NextResponse.json({ email: data.EMAIL });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
