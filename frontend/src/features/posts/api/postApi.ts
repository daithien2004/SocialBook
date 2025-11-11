import {createApi} from "@reduxjs/toolkit/query/react";
import { Post } from "../../posts/types/post.interface";
import { axiosBaseQuery } from '@/src/lib/client-api';
import {BFF_POSTS_ENDPOINTS} from "@/src/constants/client-endpoints";

export const postApi = createApi({
    reducerPath: 'postApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Post'],
    endpoints: (builder) => ({
        getPosts: builder.mutation<Post[], void>({
            query: () => ({
                url: BFF_POSTS_ENDPOINTS.getAll,
                method: 'GET',
            }),
        }),
    }),
});

export const {
    useGetPostsMutation,
} = postApi;