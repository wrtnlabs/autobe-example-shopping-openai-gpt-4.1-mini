import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSnapshot";
import { IPageIShoppingMallSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSnapshot";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Search and retrieve a paginated list of immutable shopping mall entity
 * snapshots.
 *
 * This read-only operation returns paginated results filtered by entity type,
 * ID, and creation dates. It uses filters from the request body and strictly
 * adheres to schema-verified fields.
 *
 * @param props - Request properties containing memberUser authorization and
 *   filter body.
 * @param props.memberUser - Authenticated member user payload.
 * @param props.body - Filtering criteria and pagination parameters.
 * @returns A paginated list of matching shopping mall snapshot records.
 * @throws Will throw errors from Prisma database operations if any issue
 *   arises.
 */
export async function patch__shoppingMall_memberUser_snapshots(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallSnapshot.IRequest;
}): Promise<IPageIShoppingMallSnapshot> {
  const { memberUser, body } = props;

  // Provide default pagination values for page and limit if not specified
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  // Build the where condition object filtering by available fields
  const whereCondition = {
    ...(body.entity_type !== undefined &&
      body.entity_type !== null && { entity_type: body.entity_type }),
    ...(body.entity_id !== undefined &&
      body.entity_id !== null && { entity_id: body.entity_id }),
    ...((body.created_at_from !== undefined && body.created_at_from !== null) ||
    (body.created_at_to !== undefined && body.created_at_to !== null)
      ? {
          created_at: {
            ...(body.created_at_from !== undefined &&
              body.created_at_from !== null && { gte: body.created_at_from }),
            ...(body.created_at_to !== undefined &&
              body.created_at_to !== null && { lte: body.created_at_to }),
          },
        }
      : {}),
  };

  // Execute both findMany and count queries simultaneously
  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_snapshots.findMany({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: "desc" },
    }),
    MyGlobal.prisma.shopping_mall_snapshots.count({
      where: whereCondition,
    }),
  ]);

  // Return paginated results with date fields converted to ISO string format
  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((snapshot) => ({
      id: snapshot.id,
      entity_type: snapshot.entity_type,
      entity_id: snapshot.entity_id,
      snapshot_data: snapshot.snapshot_data,
      created_at: toISOStringSafe(snapshot.created_at),
    })),
  };
}
