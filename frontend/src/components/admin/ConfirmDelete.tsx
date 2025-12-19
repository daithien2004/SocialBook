import { Popconfirm } from 'antd';
import { ReactNode } from 'react';

interface ConfirmDeleteProps {
    title?: string;
    description: ReactNode;
    onConfirm: () => void;
    children: ReactNode;
    okText?: string;
    cancelText?: string;
    okButtonProps?: any;
}

export const ConfirmDelete = ({
    title = "Xóa",
    description,
    onConfirm,
    children,
    okText = "Xóa",
    cancelText = "Hủy",
    okButtonProps
}: ConfirmDeleteProps) => {
    return (
        <Popconfirm
            title={title}
            description={description}
            onConfirm={onConfirm}
            okText={okText}
            cancelText={cancelText}
            okButtonProps={{ danger: true, ...okButtonProps }}
        >
            {children}
        </Popconfirm>
    );
};
