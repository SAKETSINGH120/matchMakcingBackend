const EmailTemplate = require("./EmailTemplate");

module.exports = {
  model: EmailTemplate,

  findByName: async (name) => {
    if (!name) {
      return null;
    }

    return EmailTemplate.findOne({
      name: String(name).trim().toLowerCase(),
      isActive: true,
    }).lean();
  },
};
