import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    useAddBookToCollectionsMutation,
    useCreateCollectionMutation,
    useGetBookLibraryInfoQuery,
    useGetCollectionsQuery,
    useUpdateLibraryStatusMutation,
} from '@/features/library/api/libraryApi';
import { LibraryStatus } from '@/features/library/types/library.interface';
import { Collection } from '@/features/library/types/library.interface';

export interface UseAddToLibraryOptions {
    bookId: string;
    userId?: string;
    isOpen: boolean;
    isAuthenticated: boolean;
}

export interface UseAddToLibraryResult {
    selectedStatus: LibraryStatus | null;
    selectedCollections: string[];
    collections: Collection[] | undefined;
    isCreating: boolean;
    newCollectionName: string;
    setSelectedStatus: (status: LibraryStatus | null) => void;
    setSelectedCollections: React.Dispatch<React.SetStateAction<string[]>>;
    setIsCreating: React.Dispatch<React.SetStateAction<boolean>>;
    setNewCollectionName: React.Dispatch<React.SetStateAction<string>>;
    handleStatusChange: (status: LibraryStatus) => Promise<void>;
    handleToggleCollection: (collectionId: string) => Promise<void>;
    handleCreateCollection: () => Promise<void>;
    resetForm: () => void;
}

export function useAddToLibrary({
    bookId,
    userId,
    isOpen,
    isAuthenticated,
}: UseAddToLibraryOptions): UseAddToLibraryResult {
    const [selectedStatus, setSelectedStatus] = useState<LibraryStatus | null>(null);
    const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    const { data: collectionsData } = useGetCollectionsQuery(userId, {
        skip: !isAuthenticated,
    });

    const { data: libraryInfo } = useGetBookLibraryInfoQuery(bookId, {
        skip: !isOpen || !isAuthenticated || !bookId,
    });

    const [updateStatus] = useUpdateLibraryStatusMutation();
    const [updateCollections] = useAddBookToCollectionsMutation();
    const [createCollection] = useCreateCollectionMutation();

    useEffect(() => {
        if (libraryInfo) {
            setSelectedStatus(libraryInfo.status);
            setSelectedCollections(libraryInfo.collections.map((c) => c.id));
        }
    }, [libraryInfo]);

    useEffect(() => {
        if (isOpen) {
            setIsCreating(false);
            setNewCollectionName('');
        }
    }, [isOpen]);

    const handleStatusChange = useCallback(async (status: LibraryStatus) => {
        setSelectedStatus(status);
        try {
            await updateStatus({ bookId, status }).unwrap();
        } catch (error: any) {
            if (error?.status !== 401) {
                toast.error('Cập nhật trạng thái thất bại');
            }
        }
    }, [bookId, updateStatus]);

    const handleToggleCollection = useCallback(async (collectionId: string) => {
        const isSelected = selectedCollections.includes(collectionId);
        let newIds: string[] = [];

        if (isSelected) {
            newIds = selectedCollections.filter((id) => id !== collectionId);
        } else {
            newIds = [...selectedCollections, collectionId];
        }

        setSelectedCollections(newIds);

        try {
            await updateCollections({ bookId, collectionIds: newIds }).unwrap();
        } catch (error: any) {
            setSelectedCollections(selectedCollections);
            if (error?.status !== 401) {
                toast.error('Cập nhật bộ sưu tập thất bại');
            }
        }
    }, [bookId, selectedCollections, updateCollections]);

    const handleCreateCollection = useCallback(async () => {
        if (!newCollectionName.trim()) return;
        try {
            const res = await createCollection({ name: newCollectionName }).unwrap();
            const newColId = res.id;

            await handleToggleCollection(newColId);

            setNewCollectionName('');
            setIsCreating(false);
        } catch (error: any) {
            if (error?.status !== 401) {
                toast.error('Tạo danh sách thất bại');
            }
        }
    }, [newCollectionName, handleToggleCollection, createCollection]);

    const resetForm = useCallback(() => {
        setIsCreating(false);
        setNewCollectionName('');
        setSelectedStatus(null);
        setSelectedCollections([]);
    }, []);

    return {
        selectedStatus,
        selectedCollections,
        collections: collectionsData,
        isCreating,
        newCollectionName,
        setSelectedStatus,
        setSelectedCollections,
        setIsCreating,
        setNewCollectionName,
        handleStatusChange,
        handleToggleCollection,
        handleCreateCollection,
        resetForm,
    };
}
