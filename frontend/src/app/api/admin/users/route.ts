import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/src/lib/server-api';
import { NESTJS_USERS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';

const forbiddenResponse = NextResponse.json(
    {
        success: false,
        statusCode: 403,
        message: 'Forbidden',
        error: 'Forbidden',
    },
    { status: 403 },
);

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.toString();

        const response = await serverApi.get(
            `${NESTJS_USERS_ENDPOINTS.getUsers}?${query}`,
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            },
        );

        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'Get users successfully',
            data: response.data?.data ?? response.data,
        });
    } catch (error: any) {
        console.error('GET /api/admin/users error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Lấy danh sách người dùng thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}
