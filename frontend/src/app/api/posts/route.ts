import { NextRequest, NextResponse } from "next/server";
import { posts } from "@/src/lib/posts";

export async function GET(request: NextRequest) {
    try {
        return NextResponse.json({
            success: true,
            statusCode: 200,
            data: posts,
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                statusCode: 500,
                message: 'Lỗi server khi lấy bài viết',
                error: error?.message || error,
            },
            { status: 500 }
        );
    }
}
