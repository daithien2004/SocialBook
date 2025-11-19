import {createApi} from "@reduxjs/toolkit/query/react";
import {axiosBaseQuery} from "@/src/lib/client-api";
import {BFF_LIKES_ENDPOINTS} from "@/src/constants/client-endpoints";




export const likeApi = createApi({
    reducerPath: "likeApi",
    baseQuery: axiosBaseQuery(),
    tagTypes: ["Like"],
    endpoints: (builder) => ({

    }),
});

export const {

} = likeApi;