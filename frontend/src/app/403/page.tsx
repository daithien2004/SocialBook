import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
    title: 'Không có quyền truy cập — SocialBook',
};

export default function ForbiddenPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-md">
                <ShieldAlert size={48} className="mx-auto mb-4 text-destructive" />
                <h1 className="text-5xl font-bold text-foreground mb-2">403</h1>
                <p className="text-xl font-semibold text-foreground mb-3">
                    Bạn không có quyền truy cập trang này
                </p>
                <p className="text-muted-foreground mb-8">
                    Tài khoản của bạn không đủ quyền, hoặc bạn không sở hữu
                    tài nguyên bạn vừa truy cập.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Về trang chủ
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
}
