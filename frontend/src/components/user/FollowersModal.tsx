import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {X, UserPlus} from "lucide-react";
import {useGetFollowersListQuery} from "@/src/features/follows/api/followApi";
import {useParams} from "next/navigation";

type FollowersModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function FollowersModal({
                                   isOpen,
                                   onClose,
                               }: FollowersModalProps) {
    const { userId } = useParams<{ userId: string }>();

    const {
        data: followersList = [],
        isLoading,
        isError,
    } = useGetFollowersListQuery(userId, {
        skip: !userId,
    });
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40" />
                </Transition.Child>

                {/* Modal panel */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-start justify-center p-4 pt-20">
                    <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl">
                                {/* nút đóng */}
                                <button
                                    onClick={onClose}
                                    className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100"
                                >
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>

                                {/* tiêu đề */}
                                <Dialog.Title className="text-center text-2xl font-semibold text-gray-500">
                                    {followersList.length} Người theo dõi
                                </Dialog.Title>

                                {/* danh sách người theo dõi */}
                                <div className="mt-5 max-h-[65vh] space-y-3 overflow-y-auto pr-1">
                                    {followersList.map((follower) => (
                                        <div
                                            key={follower.id}
                                            className="flex items-center justify-between gap-3 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={follower.image}
                                                    alt={follower.username}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                                <div className="flex flex-col">
                                                    <div className="flex flex-wrap items-center gap-x-1 text-sm">
                                                        <span className="font-normal text-gray-800">
                                                          {follower.username}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {follower.readingListCount > 0 && (`Danh sách đọc ${follower.readingListCount} • `)}
                                                        {follower.followersCount > 0 && (`Danh sách đọc ${follower.followersCount}`)}
                                                    </span>
                                                </div>
                                            </div>

                                            <button className="inline-flex items-center gap-1 rounded-full border border-emerald-600 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                                                <UserPlus className="h-4 w-4" />
                                                <span>Theo dõi</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
