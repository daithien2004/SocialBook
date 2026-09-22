import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    libraryQueries,
    useAddBookToCollections,
    useCreateCollection,
    useUpdateLibraryStatus,
} from '@/features/library/api/libraryApi';
import { LibraryStatus, type Collection } from '@/features/library/types/library.interface';

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

    const { data: collectionsData } = useQuery({
        ...libraryQueries.collections(userId),
        enabled: isAuthenticated,
    });

    const { data: libraryInfo } = useQuery({
        ...libraryQueries.bookInfo(bookId),
        enabled: isOpen && isAuthenticated && !!bookId,
    });

    const updateStatus = useUpdateLibraryStatus();
    const updateCollections = useAddBookToCollections();
    const createCollection = useCreateCollection();

    useEffect(() => {
        if (libraryInfo) {
            queueMicrotask(() => {
                setSelectedStatus(libraryInfo.status);
                setSelectedCollections(libraryInfo.collections.map((c) => c.id));
            });
        }
    }, [libraryInfo]);

    useEffect(() => {
        if (isOpen) {
            queueMicrotask(() => {
                setIsCreating(false);
                setNewCollectionName('');
            });
        }
    }, [isOpen]);

    const handleStatusChange = useCallback(async (status: LibraryStatus) => {
        const isRemove = status === selectedStatus;
        const previousStatus = selectedStatus;
        setSelectedStatus(isRemove ? null : status);

        try {
            if (isRemove) {
                await updateStatus.mutateAsync({ bookId, status: LibraryStatus.NONE });
            } else {
                await updateStatus.mutateAsync({ bookId, status });
            }
        } catch {
            setSelectedStatus(previousStatus);
            toast.error('Cập nhật trạng thái thất bại');
        }
    }, [bookId, selectedStatus, updateStatus]);

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
            await updateCollections.mutateAsync({ bookId, collectionIds: newIds });
        } catch {
            setSelectedCollections(selectedCollections);
            toast.error('Cập nhật bộ sưu tập thất bại');
        }
    }, [bookId, selectedCollections, updateCollections]);

    const handleCreateCollection = useCallback(async () => {
        if (!newCollectionName.trim()) return;
        try {
            const res = await createCollection.mutateAsync({ name: newCollectionName });
            const newColId = res.id;

            await handleToggleCollection(newColId);

            setNewCollectionName('');
            setIsCreating(false);
        } catch {
            toast.error('Tạo danh sách thất bại');
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
