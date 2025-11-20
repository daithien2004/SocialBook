import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const response = await serverApi.get(NESTJS_BOOKS_ENDPOINTS.getBooks);

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.response?.data?.message || 'Failed to fetch books',
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    // Lấy FormData từ request frontend
    const formData = await request.formData();

    // Tạo FormData mới để gửi sang NestJS
    const forward = new FormData();

    // ✅ Xử lý từng field một cách chính xác
    const title = formData.get('title') as string;
    const authorId = formData.get('authorId') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as string;
    const publishedYear = formData.get('publishedYear') as string;
    const genreJson = formData.get('genre') as string;
    const tagsJson = formData.get('tags') as string;

    // ✅ Append text fields
    forward.append('title', title);
    forward.append('authorId', authorId);
    forward.append('description', description || '');
    forward.append('status', status);

    if (publishedYear) {
      forward.append('publishedYear', publishedYear);
    }

    // ✅ Parse và append arrays đúng cách
    if (genreJson) {
      try {
        const genres = JSON.parse(genreJson);
        // Gửi từng giá trị riêng lẻ với cùng key
        genres.forEach((genreId: string) => {
          forward.append('genre', genreId);
        });
      } catch (error) {
        console.error('Error parsing genre:', error);
      }
    }

    if (tagsJson) {
      try {
        const tags = JSON.parse(tagsJson);
        tags.forEach((tag: string) => {
          forward.append('tags', tag);
        });
      } catch (error) {
        console.error('Error parsing tags:', error);
      }
    }

    // ✅ Xử lý file với đầy đủ metadata
    const file = formData.get('coverUrl') as File | null;
    if (file && file.size > 0) {
      // Tạo Blob với MIME type rõ ràng
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      forward.append('coverUrl', blob, file.name);
    }

    // ✅ Debug log
    console.log('📤 Forwarding to NestJS:');
    for (const [key, value] of forward.entries()) {
      if (value instanceof Blob) {
        console.log(`  ${key}: [File] ${value.size} bytes`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    // Forward sang NestJS
    const response = await fetch(NESTJS_BOOKS_ENDPOINTS.createBook, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        // ❌ KHÔNG set Content-Type, để browser tự động set với boundary
      },
      body: forward,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ NestJS response:', data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ API Route error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}


