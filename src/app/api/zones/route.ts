import { NextResponse } from 'next/server';
import { esologsClient } from '@/lib/esologs/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const trials = await esologsClient.getHardModeTrials();
    return NextResponse.json({ success: true, trials });
  } catch (error: any) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}
