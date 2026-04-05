'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    User, 
    Shield, 
    Bell, 
    Palette, 
    Camera, 
    Loader2, 
    Save, 
    Globe, 
    MapPin, 
    Link as LinkIcon, 
    Mail, 
    Calendar, 
    BadgeCheck,
    Smartphone
} from 'lucide-react';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from '@/components/ui/tabs';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAppAuth } from '@/features/auth/hooks';
import { 
    useGetUserOverviewQuery, 
    usePatchUpdateUserProfileOverviewMutation,
    usePatchUpdateUserAvatarMutation 
} from '@/features/users/api/usersApi';
import { getErrorMessage } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
    username: z.string().min(3, 'Tên người dùng phải có ít nhất 3 ký tự'),
    bio: z.string().max(160, 'Tiểu sử không được quá 160 ký tự'),
    location: z.string().max(30, 'Vị trí quá dài'),
    website: z.string().url('Website không hợp lệ').or(z.string().length(0)),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
    const { user: authUser } = useAppAuth();
    const userId = authUser?.id || '';

    const { data: overview, isLoading: isOverviewLoading, refetch } = useGetUserOverviewQuery(userId, {
        skip: !userId
    });

    const [updateProfile, { isLoading: isUpdatingProfile }] = usePatchUpdateUserProfileOverviewMutation();
    const [updateAvatar, { isLoading: isUpdatingAvatar }] = usePatchUpdateUserAvatarMutation();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: '',
            bio: '',
            location: '',
            website: '',
        }
    });

    useEffect(() => {
        if (overview) {
            form.reset({
                username: overview.username || '',
                bio: overview.bio || '',
                location: overview.location || '',
                website: overview.website || '',
            });
        }
    }, [overview, form]);

    const onProfileSubmit = async (values: ProfileFormValues) => {
        try {
            await updateProfile({
                userId,
                body: {
                    ...values,
                    username: values.username,
                }
            }).unwrap();
            toast.success('Cập nhật hồ sơ thành công!');
            refetch();
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh quá lớn (tối đa 5MB)');
            return;
        }

        try {
            await updateAvatar({ file, userId }).unwrap();
            toast.success('Cập nhật ảnh đại diện thành công!');
            refetch();
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    if (isOverviewLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-10 px-6 animate-in fade-in duration-500">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight dark:text-white">Cài đặt tài khoản</h1>
                <p className="text-muted-foreground mt-2 text-lg">Quản lý hồ sơ công khai và các tùy chọn bảo mật của bạn.</p>
            </header>

            <Tabs defaultValue="profile" className="space-y-8">
                <TabsList className="bg-muted/50 p-1 rounded-xl w-full sm:w-auto h-auto flex flex-wrap sm:flex-nowrap">
                    <TabsTrigger value="profile" className="flex-1 sm:flex-none gap-2 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 shadow-sm transition-all font-bold">
                        <User className="w-4 h-4" /> Hồ sơ
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex-1 sm:flex-none gap-2 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 shadow-sm transition-all font-bold">
                        <Shield className="w-4 h-4" /> Tài khoản
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex-1 sm:flex-none gap-2 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 shadow-sm transition-all font-bold opacity-50 cursor-not-allowed">
                        <Bell className="w-4 h-4" /> Thông báo
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex-1 sm:flex-none gap-2 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 shadow-sm transition-all font-bold opacity-50 cursor-not-allowed">
                        <Palette className="w-4 h-4" /> Giao diện
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="animate-in slide-in-from-left-4 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Avatar Section */}
                        <Card className="lg:col-span-1 border-none shadow-xl bg-white dark:bg-zinc-950 overflow-hidden h-fit">
                            <CardHeader className="text-center bg-gray-50/50 dark:bg-zinc-900/30 pb-0">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Ảnh đại diện</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center pt-8 pb-10">
                                <div className="relative group cursor-pointer">
                                    <Avatar className="w-40 h-40 ring-4 ring-white dark:ring-zinc-900 shadow-2xl transition-transform group-hover:scale-[1.02]">
                                        <AvatarImage src={overview?.image || ''} className="object-cover" />
                                        <AvatarFallback className="bg-blue-600 text-white text-4xl font-bold">
                                            {overview?.username?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer backdrop-blur-[2px]">
                                        {isUpdatingAvatar ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
                                    </label>
                                    <input 
                                        id="avatar-upload" 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleAvatarChange}
                                        disabled={isUpdatingAvatar}
                                    />
                                </div>
                                <div className="mt-6 text-center">
                                    <h3 className="text-lg font-bold">@{overview?.username}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Dung lượng tối đa 5MB. Định dạng: JPG, PNG, WEBP.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Profile Info Form */}
                        <Card className="lg:col-span-2 border-none shadow-xl bg-white dark:bg-zinc-950">
                            <CardHeader>
                                <CardTitle>Thông tin cá nhân</CardTitle>
                                <CardDescription>Thông tin này sẽ hiển thị công khai trên hồ sơ của bạn.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="username"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold flex items-center gap-2">
                                                        Tên hiển thị <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ví dụ: nguoi_yeu_sach" {...field} className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-900/10 focus:ring-blue-500" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="bio"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Tiểu sử</FormLabel>
                                                    <FormControl>
                                                        <Textarea 
                                                            placeholder="Một chút về bản thân bạn..." 
                                                            className="min-h-[120px] rounded-xl bg-gray-50/50 dark:bg-zinc-900/10 focus:ring-blue-500 resize-none" 
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Giới thiệu ngắn gọn về bạn cho cộng đồng.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="location"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold flex items-center gap-2">
                                                            <MapPin className="w-3.5 h-3.5" /> Vị trí
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Hà Nội, Việt Nam" {...field} className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-900/10" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="website"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold flex items-center gap-2">
                                                            <Globe className="w-3.5 h-3.5" /> Website
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="https://example.com" {...field} className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-900/10" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <Button type="submit" className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold active:scale-95 transition-all" disabled={isUpdatingProfile}>
                                                {isUpdatingProfile ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                                LƯU THAY ĐỔI
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Account Tab */}
                <TabsContent value="account" className="animate-in slide-in-from-right-4 duration-300">
                    <Card className="max-w-3xl mx-auto border-none shadow-xl bg-white dark:bg-zinc-950">
                        <CardHeader>
                            <CardTitle>Dữ liệu tài khoản</CardTitle>
                            <CardDescription>Thông tin định danh và bảo mật cho tài khoản của bạn.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-1.5 flex flex-col items-start">
                                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                        <Mail className="w-3.5 h-3.5" /> Email Đăng Nhập
                                    </div>
                                    <div className="text-lg font-semibold flex items-center gap-2 truncate w-full">
                                        {authUser?.email}
                                        {authUser?.emailVerified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
                                    </div>
                                    <div className="text-xs text-muted-foreground italic flex items-center gap-1.5 mt-1">
                                        <Globe className="w-3 h-3" /> Tài khoản liên kết qua {authUser?.provider || 'Auth'}
                                    </div>
                                </div>

                                <div className="space-y-1.5 flex flex-col items-start">
                                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                        <Calendar className="w-3.5 h-3.5" /> Ngày Tham Gia
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {overview?.createdAt ? new Date(overview.createdAt).toLocaleDateString('vi-VN', { 
                                            day: '2-digit', 
                                            month: 'long', 
                                            year: 'numeric' 
                                        }) : 'Chưa rõ'}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Chào mừng bạn gia nhập cộng đồng!</div>
                                </div>
                            </div>
                            
                            <Separator />

                            <div className="space-y-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-blue-600" /> Bảo mật
                                </h3>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-transparent hover:border-blue-500/10 transition-all group">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 flex-none mt-1 group-hover:scale-110 transition-transform">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold">Xác thực 2 yếu tố (2FA)</div>
                                            <p className="text-sm text-muted-foreground">Tăng cường bảo mật bằng cách yêu cầu mã xác minh qua điện thoại hoặc email.</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="rounded-xl font-bold h-11 border-blue-500/20 text-blue-600 hover:bg-blue-50 hover:text-blue-700">Thiết lập ngay</Button>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-transparent hover:border-blue-500/10 transition-all group">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 flex-none mt-1 group-hover:scale-110 transition-transform">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-amber-900 dark:text-amber-400 text-lg">Đổi mật khẩu</div>
                                            <p className="text-sm text-muted-foreground">Bạn nên đổi mật khẩu định kỳ 6 tháng một lần để đảm bảo an toàn.</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="rounded-xl font-bold h-11 border-amber-500/20 text-amber-600 hover:bg-amber-50 hover:text-amber-700">Thay đổi</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
