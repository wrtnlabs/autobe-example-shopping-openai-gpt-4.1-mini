import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Creates a new fraud detection record in the system.
 *
 * This operation records an AI-detected suspicious activity involving a member
 * user, optionally linked to an order. It captures detection details including
 * type, confidence score, resolution status, optional notes, and timestamps.
 *
 * Administrator permissions are required to perform this creation.
 *
 * @param props - Object containing adminUser authorization and fraud detection
 *   data
 * @param props.adminUser - Authenticated admin user performing the operation
 * @param props.body - Fraud detection creation data
 * @returns The newly created fraud detection record with full details
 * @throws {Error} Throws if creation fails due to database or validation errors
 */
export async function post__shoppingMall_adminUser_fraudDetections(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallFraudDetection.ICreate;
}): Promise<IShoppingMallFraudDetection> {
  const { adminUser, body } = props;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_fraud_detections.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      user_id: body.user_id,
      order_id: body.order_id ?? null,
      detection_type: body.detection_type,
      confidence_score: body.confidence_score,
      resolution_status: body.resolution_status,
      details: body.details ?? null,
      detected_at: body.detected_at,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  return {
    id: created.id as string & tags.Format<"uuid">,
    user_id: created.user_id as string & tags.Format<"uuid">,
    order_id: created.order_id ?? null,
    detection_type: created.detection_type,
    confidence_score: created.confidence_score,
    resolution_status: created.resolution_status,
    details: created.details ?? null,
    detected_at: toISOStringSafe(created.detected_at),
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
