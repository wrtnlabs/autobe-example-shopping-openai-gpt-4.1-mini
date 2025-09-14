import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Permanently deletes a shopping mall fraud detection record by its UUID.
 *
 * This operation performs a hard delete, completely removing the record from
 * the database. It requires administrative authorization and will throw if the
 * record does not exist.
 *
 * @param props - Parameters including the admin user payload and
 *   fraudDetectionId
 * @param props.adminUser - The authorized admin user performing the deletion
 * @param props.fraudDetectionId - UUID of the fraud detection record to delete
 * @throws {Error} If the fraud detection record does not exist
 */
export async function delete__shoppingMall_adminUser_fraudDetections_$fraudDetectionId(props: {
  adminUser: AdminuserPayload;
  fraudDetectionId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { fraudDetectionId } = props;

  const existing =
    await MyGlobal.prisma.shopping_mall_fraud_detections.findUnique({
      where: { id: fraudDetectionId },
      select: { id: true },
    });

  if (!existing) {
    throw new Error(
      `Fraud detection record with id ${fraudDetectionId} not found.`,
    );
  }

  await MyGlobal.prisma.shopping_mall_fraud_detections.delete({
    where: { id: fraudDetectionId },
  });
}
