import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve detailed information about a specific fraud detection event by its
 * unique identifier.
 *
 * This operation fetches the detailed record of a fraud detection event
 * including user flagged, detection type, confidence score, resolution status,
 * and timeline information.
 *
 * Access is restricted to users with administrative privileges.
 *
 * @param props - Object containing adminUser authentication and
 *   fraudDetectionId parameter
 * @param props.adminUser - The authenticated admin user performing the
 *   operation
 * @param props.fraudDetectionId - Unique identifier for the fraud detection
 *   record
 * @returns The detailed fraud detection record matching the given ID
 * @throws {Error} If the fraud detection record is not found
 */
export async function get__shoppingMall_adminUser_fraudDetections_$fraudDetectionId(props: {
  adminUser: AdminuserPayload;
  fraudDetectionId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallFraudDetection> {
  const { fraudDetectionId } = props;
  const found =
    await MyGlobal.prisma.shopping_mall_fraud_detections.findUniqueOrThrow({
      where: { id: fraudDetectionId, deleted_at: null },
    });

  return {
    id: found.id,
    user_id: found.user_id,
    order_id: found.order_id ?? null,
    detection_type: found.detection_type,
    confidence_score: found.confidence_score,
    resolution_status: found.resolution_status,
    details: found.details ?? null,
    detected_at: toISOStringSafe(found.detected_at),
    created_at: toISOStringSafe(found.created_at),
    updated_at: toISOStringSafe(found.updated_at),
    deleted_at: found.deleted_at ? toISOStringSafe(found.deleted_at) : null,
  };
}
