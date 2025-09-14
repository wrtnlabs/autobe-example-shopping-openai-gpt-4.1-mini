import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Create a new sale option group.
 *
 * This operation creates a sales option group record in the shopping mall
 * backend. It accepts option group creation details and returns the created
 * entity with timestamps and IDs assigned.
 *
 * Only authenticated seller users with appropriate permissions are authorized
 * to perform this operation.
 *
 * @param props - Object containing sellerUser authentication payload and the
 *   create body
 * @param props.sellerUser - The authenticated seller user performing the
 *   creation
 * @param props.body - The sale option group creation data
 * @returns The created sale option group with all fields including timestamps
 * @throws {Error} When a uniqueness violation occurs (e.g., duplicate code)
 * @throws {Error} When input data validation fails
 */
export async function post__shoppingMall_sellerUser_saleOptionGroups(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSaleOptionGroup.ICreate;
}): Promise<IShoppingMallSaleOptionGroup> {
  const { sellerUser, body } = props;

  const now = toISOStringSafe(new Date());
  const id = v4() as string & tags.Format<"uuid">;

  const created = await MyGlobal.prisma.shopping_mall_sale_option_groups.create(
    {
      data: {
        id,
        code: body.code,
        name: body.name,
        created_at: now,
        updated_at: now,
      },
    },
  );

  return {
    id: created.id,
    code: created.code,
    name: created.name,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
