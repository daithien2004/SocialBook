import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {X, UserPlus} from "lucide-react";
import {useGetFollowersListQuery} from "@/src/features/follows/api/followApi";
import {useParams} from "next/navigation";
import FollowerItem from "@/src/components/user/follower-item";

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
        skip: !userId || !isOpen,
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
                    <div className="fixed inset-0 bg-black/40 dark:bg-black/60" />
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
                            <Dialog.Panel
                                className="
                relative w-full max-w-xl
                transform overflow-hidden rounded-2xl
                bg-white dark:bg-[#1a1a1a]
                border border-slate-100 dark:border-gray-800
                p-6 text-left shadow-xl
              "
                            >
                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="
                  absolute right-4 top-4 rounded-full p-1
                  hover:bg-slate-100 dark:hover:bg-gray-800
                  transition-colors
                "
                                >
                                    <X className="h-5 w-5 text-slate-500 dark:text-gray-400" />
                                </button>

                                {/* Title */}
                                <Dialog.Title className="text-center text-2xl font-semibold text-slate-700 dark:text-neutral-500">
                                    {followersList.length} Người theo dõi
                                </Dialog.Title>

                                {/* Followers list */}
                                <div className="mt-5 max-h-[65vh] space-y-3 overflow-y-auto pr-1">
                                    {followersList.map((follower) => (
                                        <FollowerItem key={follower.id} {...follower} />
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
