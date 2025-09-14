import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update existing fraud detection information
 *
 * Modify an existing fraud detection record by its UUID. Requires
 * administrative access. Allows updates to detection classification, confidence
 * score, resolution status, details, and timestamps.
 *
 * @param props - Object containing all necessary parameters
 * @param props.adminUser - The authenticated admin user performing the update
 * @param props.fraudDetectionId - Unique identifier of the fraud detection
 *   record
 * @param props.body - Update payload with changes
 * @returns The updated fraud detection record
 * @throws {Error} If the fraud detection record with given ID does not exist
 */
export async function put__shoppingMall_adminUser_fraudDetections_$fraudDetectionId(props: {
  adminUser: AdminuserPayload;
  fraudDetectionId: string & tags.Format<"uuid">;
  body: IShoppingMallFraudDetection.IUpdate;
}): Promise<IShoppingMallFraudDetection> {
  const { fraudDetectionId, body } = props;

  // Verify existing record
  const existing =
    await MyGlobal.prisma.shopping_mall_fraud_detections.findUniqueOrThrow({
      where: { id: fraudDetectionId },
    });

  // Update record
  const updated = await MyGlobal.prisma.shopping_mall_fraud_detections.update({
    where: { id: fraudDetectionId },
    data: {
      detection_type: body.detection_type ?? undefined,
      confidence_score: body.confidence_score ?? undefined,
      resolution_status: body.resolution_status ?? undefined,
      details: body.details === null ? null : (body.details ?? undefined),
      detected_at: body.detected_at ?? undefined,
      deleted_at:
        body.deleted_at === null ? null : (body.deleted_at ?? undefined),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    user_id: updated.user_id,
    order_id: updated.order_id ?? null,
    detection_type: updated.detection_type,
    confidence_score: updated.confidence_score,
    resolution_status: updated.resolution_status,
    details: updated.details ?? null,
    detected_at: toISOStringSafe(updated.detected_at),
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
