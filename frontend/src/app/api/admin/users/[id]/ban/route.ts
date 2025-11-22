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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return forbiddenResponse;
    }

    const { id } = await params;

    try {
        const response = await serverApi.patch(
            NESTJS_USERS_ENDPOINTS.banUser(id),
            {},
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            },
        );

        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'User ban status updated successfully',
            data: response.data?.data ?? response.data,
        });
    } catch (error: any) {
        console.error('PATCH /api/admin/users/[id]/ban error:', error.response?.data || error.message);

        return NextResponse.json(
            {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Cập nhật trạng thái người dùng thất bại',
                error: error.response?.data?.error || 'Server Error',
            },
            { status: error.response?.status || 500 },
        );
    }
}
