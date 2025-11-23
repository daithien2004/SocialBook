// api/admin/books/id/[bookId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NESTJS_BOOKS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getAuthenticatedServerApi } from '@/src/lib/auth-server-api';

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

        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.get(
            NESTJS_BOOKS_ENDPOINTS.getBookById(bookId),
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('GET /api/admin/books/id/[bookId] error:', error.response?.data);
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

        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.put(
            NESTJS_BOOKS_ENDPOINTS.updateBook(bookId),
            formData,
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('PUT /api/admin/books/id/[bookId] error:', error.response?.data);
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

        const authenticatedApi = await getAuthenticatedServerApi();
        const response = await authenticatedApi.delete(
            NESTJS_BOOKS_ENDPOINTS.deleteBook(bookId),
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('DELETE /api/admin/books/id/[bookId] error:', error.response?.data);
        return NextResponse.json(
            error.response?.data || { error: 'Failed to delete book' },
            { status: error.response?.status || 500 }
        );
    }
}
