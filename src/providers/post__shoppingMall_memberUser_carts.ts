import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Creates a new shopping cart for a member user.
 *
 * This operation inserts a new record into the shopping_mall_carts table. The
 * cart may be linked to a guest user or a member user, based on the provided
 * information in the request body.
 *
 * @param props - Object containing the memberUser authentication and the new
 *   shopping cart creation data.
 * @param props.memberUser - The authenticated member user payload.
 * @param props.body - The request body containing cart creation info.
 * @returns The newly created shopping cart record with all fields, including
 *   generated ID and timestamps.
 * @throws {Error} When creation fails due to database or other internal errors.
 */
export async function post__shoppingMall_memberUser_carts(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallCarts.ICreate;
}): Promise<IShoppingMallCarts> {
  const id = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date()) as string & tags.Format<"date-time">;

  const created = await MyGlobal.prisma.shopping_mall_carts.create({
    data: {
      id: id,
      guest_user_id: props.body.guest_user_id ?? null,
      member_user_id: props.body.member_user_id ?? null,
      status: props.body.status,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  return {
    id: created.id,
    guest_user_id: created.guest_user_id ?? null,
    member_user_id: created.member_user_id ?? null,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
