import { disconnect } from "mongoose";
import { connectDatabase } from "../config/database";
import { UserModel } from "../modules/users/user.model";

const uid = process.env.ADMIN_UID?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.ADMIN_NAME?.trim() || "Administrador Zivena";

if (!uid || !email) {
  throw new Error("ADMIN_UID and ADMIN_EMAIL are required");
}

const bootstrap = async (): Promise<void> => {
  await connectDatabase();

  const user = await UserModel.findOneAndUpdate(
    { uid },
    {
      $set: {
        name,
        email,
        role: "admin",
        isActive: true,
        "metadata.authProvider": "firebase",
        "metadata.bootstrapAdmin": true
      }
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
      setDefaultsOnInsert: true
    }
  ).lean();

  console.info(`[bootstrap] Administrator ready: ${user?.email} (${uid})`);
};

bootstrap()
  .catch((error) => {
    console.error("[bootstrap] Failed to create administrator", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnect();
  });
