import { Facebook, Mail, Twitter, X, Link2, Check } from "lucide-react";
import {
    EmailShareButton,
    FacebookShareButton,
    PinterestShareButton,
    TumblrShareButton,
    TwitterShareButton,
} from "next-share";
import { useState } from "react";

interface SharePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    postUrl: string;
    shareTitle: string;
    shareMedia: string;
}

const SharePostModal: React.FC<SharePostModalProps> = ({
                                                           isOpen,
                                                           onClose,
                                                           postUrl,
                                                           shareTitle,
                                                           shareMedia,
                                                       }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(postUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const PinterestIcon = () => (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
        </svg>
    );

    const TumblrIcon = () => (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.941 0 9.999 0h3.517v6.114h4.801v3.633h-4.82v7.47c.016 1.001.375 2.371 2.207 2.371h.09c.631-.02 1.486-.205 1.936-.419l1.156 3.425c-.436.636-2.4 1.374-4.156 1.404h-.178l.011.002z"/>
        </svg>
    );

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto animate-in fade-in zoom-in-95 duration-200 border border-gray-200/50 dark:border-gray-700/50">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    Chia sẻ bài viết
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Chọn nền tảng bạn muốn chia sẻ
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Đóng"
                            >
                                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5">
                        {/* Social Share Buttons - Horizontal Row */}
                        <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
                            {/* Facebook */}
                            <FacebookShareButton url={postUrl} quote={shareTitle}>
                                <div className="bg-[#1877f2] hover:bg-[#166fe5] flex items-center justify-center rounded-full p-3.5 text-white transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95 group relative" title="Facebook">
                                    <Facebook className="h-5 w-5 transition-transform group-hover:rotate-6" />
                                </div>
                            </FacebookShareButton>

                            {/* Twitter */}
                            <TwitterShareButton url={postUrl} title={shareTitle}>
                                <div className="bg-[#1da1f2] hover:bg-[#1a94da] flex items-center justify-center rounded-full p-3.5 text-white transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95 group relative" title="Twitter">
                                    <Twitter className="h-5 w-5 transition-transform group-hover:rotate-6" />
                                </div>
                            </TwitterShareButton>

                            {/* Pinterest */}
                            <PinterestShareButton url={postUrl} media={shareMedia} description={shareTitle}>
                                <div className="bg-[#e60023] hover:bg-[#d50020] flex items-center justify-center rounded-full p-3.5 text-white transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95 group relative" title="Pinterest">
                                    <PinterestIcon />
                                </div>
                            </PinterestShareButton>

                            {/* Tumblr */}
                            <TumblrShareButton url={postUrl} title={shareTitle} caption={shareTitle}>
                                <div className="bg-[#35465c] hover:bg-[#2c3a4d] flex items-center justify-center rounded-full p-3.5 text-white transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95 group relative" title="Tumblr">
                                    <TumblrIcon />
                                </div>
                            </TumblrShareButton>

                            {/* Email */}
                            <EmailShareButton url={postUrl} subject={shareTitle} body={`Xem bài viết này: ${postUrl}`}>
                                <div className="bg-[#ea4335] hover:bg-[#d93025] flex items-center justify-center rounded-full p-3.5 text-white transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95 group relative" title="Email">
                                    <Mail className="h-5 w-5 transition-transform group-hover:rotate-6" />
                                </div>
                            </EmailShareButton>
                        </div>

                        {/* Divider */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-white dark:bg-[#1a1a1a] px-3 text-gray-500 dark:text-gray-400 font-medium">
                                    Hoặc sao chép liên kết
                                </span>
                            </div>
                        </div>

                        {/* Copy Link Section */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                            <Link2 className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                                {postUrl}
                            </span>
                            <button
                                onClick={handleCopyLink}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex-shrink-0 ${
                                    copied
                                        ? "bg-green-500 text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95"
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        <span>Đã sao</span>
                                    </>
                                ) : (
                                    <span>Sao chép</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            Chia sẻ để nhiều người khám phá nội dung tuyệt vời này 🚀
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SharePostModal;