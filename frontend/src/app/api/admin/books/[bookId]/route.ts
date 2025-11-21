// api/admin/books/[bookId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';

// GET single book by ID for editing
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ bookId: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const { bookId } = await params;

        const response = await serverApi.get(
            NESTJS_BOOKS_ENDPOINTS.getBookById(bookId),
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('GET /api/admin/books/[bookId] error:', error.response?.data);
        return NextResponse.json(
            error.response?.data || { error: 'Failed to fetch book' },
            { status: error.response?.status || 500 }
        );
    }
}

// PUT/PATCH update book
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ bookId: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const { bookId } = await params;

        // Get FormData from request (supports file upload)
        const formData = await request.formData();

        const response = await serverApi.put(
            NESTJS_BOOKS_ENDPOINTS.updateBook(bookId),
            formData,
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                    // Don't set Content-Type, let axios handle it for FormData
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('PUT /api/admin/books/[bookId] error:', error.response?.data);
        return NextResponse.json(
            error.response?.data || { error: 'Failed to update book' },
            { status: error.response?.status || 500 }
        );
    }
}

// DELETE book
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ bookId: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const { bookId } = await params;

        const response = await serverApi.delete(
            NESTJS_BOOKS_ENDPOINTS.deleteBook(bookId),
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('DELETE /api/admin/books/[bookId] error:', error.response?.data);
        return NextResponse.json(
            error.response?.data || { error: 'Failed to delete book' },
            { status: error.response?.status || 500 }
        );
    }
}
