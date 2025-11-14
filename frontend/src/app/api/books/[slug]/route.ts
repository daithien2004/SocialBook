// pages/api/books/[slug].ts
import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    // Gọi backend thật (NestJS)
    const res = await serverApi.get(`/books/${slug}`); 
    // Trả về đúng format mà client mong đợi
    return NextResponse.json({
      success: true,
      statusCode: 200,
      message: 'Book retrieved successfully',
      data: res.data.data || res.data, 
    });
    
  } catch (err: any) {
    console.error('GET /api/books/[slug] error:', err);
    
    return NextResponse.json(
      {
        success: false,
        statusCode: err.response?.status || 500,
        message: err.response?.data?.message || 'Internal Server Error',
        error: 'Backend Error',
        timestamp: new Date().toISOString(),
        path: `/api/books/${slug}`,
      },
      { status: err.response?.status || 500 }
    );
  }
}