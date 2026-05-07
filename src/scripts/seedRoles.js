/**
 * Seed Script — Roles with Embedded Permissions
 * -----------------------------------------------
 * Creates the three system roles (super_admin, admin, moderator)
 * with permissions embedded directly inside each role.
 *
 * Safe to run multiple times — it upserts, never duplicates.
 *
 * Usage:  node src/scripts/seedRoles.js
 */

const mongoose = require("mongoose");
const config = require("../../config/config");
const Role = require("../models/role/role");
const { PERMISSION_SECTIONS, ADMIN_ROLES } = require("../constants");

const seed = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to database\n");

    // Build full permissions array (all sections, all CRUD enabled)
    const fullPermissions = PERMISSION_SECTIONS.map((section) => ({
      sectionName: section,
      isCreate: true,
      isRead: true,
      isUpdate: true,
      isDelete: true,
    }));

    // ── 1. super_admin — full access to everything ─────────
    await Role.findOneAndUpdate(
      { name: ADMIN_ROLES.SUPER_ADMIN },
      {
        $set: {
          name: ADMIN_ROLES.SUPER_ADMIN,
          description:
            "Full system access - can manage all permissions and roles",
          permissions: fullPermissions,
          isDefault: true,
        },
      },
      { upsert: true, new: true },
    );
    console.log(
      `  ✓ Role: super_admin (${fullPermissions.length} permissions)`,
    );

    // ── 2. admin — starts empty (super_admin assigns later) ─
    await Role.findOneAndUpdate(
      { name: ADMIN_ROLES.ADMIN },
      {
        $set: {
          name: ADMIN_ROLES.ADMIN,
          description: "Admin role - permissions assigned by super_admin",
          permissions: [],
          isDefault: true,
        },
      },
      { upsert: true, new: true },
    );
    console.log("  ✓ Role: admin (no permissions - assign manually)");

    // ── 3. moderator — starts empty ────────────────────────
    await Role.findOneAndUpdate(
      { name: ADMIN_ROLES.MODERATOR },
      {
        $set: {
          name: ADMIN_ROLES.MODERATOR,
          description: "Moderator role - permissions assigned by super_admin",
          permissions: [],
          isDefault: true,
        },
      },
      { upsert: true, new: true },
    );
    console.log("  ✓ Role: moderator (no permissions - assign manually)");

    console.log("\nSeeding completed successfully!");
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

seed();
