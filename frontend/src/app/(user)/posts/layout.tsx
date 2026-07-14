import { ReactNode } from 'react';

export default function PostsLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <>
            {children}
        </>
    );
}
