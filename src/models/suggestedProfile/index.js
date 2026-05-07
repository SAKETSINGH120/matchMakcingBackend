const AdminSuggestedProfiles = require("./adminSuggestedProfiles");

module.exports = {
  addProfileToUserFeed: async ({ userId, profileIds, addedBy }) => {
    // Deduplicate profile IDs
    // const uniqueProfileIds = [...new Set(profileIds.map((id) => String(id)))];

    const operations = profileIds.map((profileId) => ({
      updateOne: {
        filter: { userId, profileId },
        update: {
          $set: {
            userId,
            profileId,
            status: "active",
            ...(addedBy && { addedBy }),
          },
        },
        upsert: true,
      },
    }));

    return AdminSuggestedProfiles.bulkWrite(operations, { ordered: false });
  },
};
