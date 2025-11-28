import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_GEMINI_ENDPOINTS } from '@/src/constants/server-endpoints';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const response = await serverApi.post(
      NESTJS_GEMINI_ENDPOINTS.summarizeChapter(chapterId)
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.response?.data?.message || 'Failed to summarize chapter',
      },
      { status: error.response?.status || 500 }
    );
  }
}
