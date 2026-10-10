import { baseApi } from "../baseUrl";

// gamification api
export const gamificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get gamification settings
    getGamification: builder.query({
      query: () => ({
        url: "/gamification/settings",
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["Gamification"],
    }),

    // upsert gamification settings
    updateGamification: builder.mutation({
      query: (data) => ({
        url: "/gamification/settings",
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Gamification"],
    }),

    // get all badges
    getAllBadges: builder.query({
      query: () => ({
        url: "/gamification/all-badges",
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["Gamification"],
    }),

    // toggle badge status (active/inactive)
    toggleBadgeStatus: builder.mutation({
      query: ({ badgeId, isActive }) => {
        return {
          url: `/gamification/badges/${badgeId}/active`,
          method: "PATCH",
          body: { isActive },
          headers: {
            Authorization: `${localStorage.getItem("accessToken")}`,
          },
        };
      },
      invalidatesTags: ["Gamification"],
    }),

    // delete badge
    deleteBadge: builder.mutation({
      query: (badgeId) => {
        return {
          url: `/gamification/badges/${badgeId}`,
          method: "PATCH",
          headers: {
            Authorization: `${localStorage.getItem("accessToken")}`,
          },
        };
      },
      invalidatesTags: ["Gamification"],
    }),

    // create badge
    createBadge: builder.mutation({
      query: (badgeData) => {
        // Check if iconUrl is a file (for form-data) or URL (for JSON)
        const isFileUpload =
          badgeData.iconUrl && badgeData.iconUrl.startsWith("data:");

        if (isFileUpload) {
          // Use FormData for file uploads
          const formData = new FormData();
          formData.append("name", badgeData.name);
          formData.append("description", badgeData.description);
          formData.append("iconUrl", badgeData.iconUrl); // Changed from "icon" to "iconUrl"
          formData.append("badgeType", badgeData.badgeType);
          formData.append("xpReward", badgeData.xpReward.toString());
          formData.append("pointsReward", badgeData.pointsReward.toString());

          return {
            url: "/gamification/badges",
            method: "POST",
            body: formData,
            headers: {
              Authorization: `${localStorage.getItem("accessToken")}`,
              // Don't set Content-Type for FormData - browser sets it automatically with boundary
            },
          };
        } else {
          // Use regular JSON for URL uploads
          return {
            url: "/gamification/badges",
            method: "POST",
            body: badgeData,
            headers: {
              Authorization: `${localStorage.getItem("accessToken")}`,
              "Content-Type": "application/json",
            },
          };
        }
      },
      invalidatesTags: ["Gamification"],
    }),

    // get levels all
    getLevelsAll: builder.query({
      query: () => {
        return {
          url: "/gamification/level/all",
          method: "GET",
          headers: {
            Authorization: `${localStorage.getItem("accessToken")}`,
          },
        };
      },
      providesTags: ["Gamification"],
    }),

    // delete level
    deleteLevel: builder.mutation({
      query: (levelId) => ({
        url: `/gamification/level/${levelId}`,
        method: "DELETE",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Gamification"],
    }),

    // create level
    createLevel: builder.mutation({
      query: (levelData) => ({
        url: "/gamification/level/create",
        method: "POST",
        body: levelData,
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["Gamification"],
    }),

    // update level
    updateLevel: builder.mutation({
      query: ({ levelId, levelData }) => ({
        url: `/gamification/level/${levelId}`,
        method: "PATCH",
        body: levelData,
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["Gamification"],
    }),
  }),
});

export const {
  useGetGamificationQuery,
  useUpdateGamificationMutation,
  useGetAllBadgesQuery,
  useGetLevelsAllQuery,
  useUpdateLevelMutation,
  useDeleteLevelMutation,
  useCreateLevelMutation,
  useToggleBadgeStatusMutation,
  useDeleteBadgeMutation,
  useCreateBadgeMutation,
} = gamificationApi;
