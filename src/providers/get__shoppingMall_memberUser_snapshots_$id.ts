import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSnapshot";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieve a snapshot by its unique identifier.
 *
 * This operation retrieves a detailed entity snapshot record by its unique ID
 * from the shopping_mall_snapshots table. It returns the full immutable
 * snapshot data stored as a JSON string along with metadata, primarily for
 * audit and compliance review.
 *
 * Access is restricted to authenticated member users.
 *
 * @param props - Object containing the authenticated member user payload and
 *   snapshot ID
 * @param props.memberUser - The authenticated member user executing the request
 * @param props.id - The UUID of the snapshot to retrieve
 * @returns The snapshot record matching the specified ID
 * @throws {Error} Throws if the snapshot with the specified ID does not exist
 */
export async function get__shoppingMall_memberUser_snapshots_$id(props: {
  memberUser: MemberuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSnapshot> {
  const { id } = props;

  const snapshot =
    await MyGlobal.prisma.shopping_mall_snapshots.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        entity_type: true,
        entity_id: true,
        snapshot_data: true,
        created_at: true,
      },
    });

  return {
    id: snapshot.id,
    entity_type: snapshot.entity_type,
    entity_id: snapshot.entity_id,
    snapshot_data: snapshot.snapshot_data,
    created_at: toISOStringSafe(snapshot.created_at),
  };
}
