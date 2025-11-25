'use client';

import { useState } from 'react';
import { Table, Button, Tag, Space, Popconfirm, message } from 'antd';
import { useGetUsersQuery, useBanUserMutation } from '@/src/features/users/api/usersApi';
import { User } from '@/src/features/users/types/user.types';
import { ColumnsType } from 'antd/es/table';

const UsersPage = () => {
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const { data, isLoading, isFetching } = useGetUsersQuery(
        `current=${current}&pageSize=${pageSize}`
    );
    const [banUser] = useBanUserMutation();

    const handleTableChange = (pagination: any) => {
        setCurrent(pagination.current);
        setPageSize(pagination.pageSize);
    };

    const handleBan = async (id: string) => {
        try {
            await banUser(id).unwrap();
            message.success('Cập nhật trạng thái người dùng thành công');
        } catch (error) {
            message.error('Có lỗi xảy ra');
        }
    };

    const columns: ColumnsType<User> = [
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Provider',
            dataIndex: 'provider',
            key: 'provider',
            render: (provider: string) => (
                <Tag color={provider === 'google' ? 'red' : provider === 'facebook' ? 'blue' : 'default'}>
                    {provider}
                </Tag>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, record) => (
                <Space>
                    {record.isBanned ? (
                        <Tag color="error">Banned</Tag>
                    ) : (
                        <Tag color="success">Active</Tag>
                    )}
                    {record.isVerified ? (
                        <Tag color="blue">Verified</Tag>
                    ) : (
                        <Tag color="warning">Unverified</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Popconfirm
                    title={record.isBanned ? 'Mở khóa người dùng này?' : 'Khóa người dùng này?'}
                    onConfirm={() => handleBan(record.id)}
                    okText="Đồng ý"
                    cancelText="Hủy"
                >
                    <Button type={record.isBanned ? 'primary' : 'dashed'} danger={!record.isBanned}>
                        {record.isBanned ? 'Unban' : 'Ban'}
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Quản lý người dùng</h1>
            <Table
                columns={columns}
                dataSource={data?.items}
                rowKey="id"
                pagination={{
                    current: current,
                    pageSize: pageSize,
                    total: data?.pagination?.totalItems,
                    showSizeChanger: true,
                }}
                loading={isLoading || isFetching}
                onChange={handleTableChange}
            />
        </div>
    );
};

export default UsersPage;