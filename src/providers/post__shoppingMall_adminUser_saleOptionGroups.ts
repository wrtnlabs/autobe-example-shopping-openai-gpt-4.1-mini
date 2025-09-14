import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create a new sale option group.
 *
 * Receives option group information and saves it to the database.
 *
 * Performs validation on input data including uniqueness of code.
 *
 * Returns the newly created option group for confirmation.
 *
 * Restricted to users with roles such as adminUser.
 *
 * @param props - Object containing adminUser payload and body for creation
 * @param props.adminUser - The authenticated admin user
 * @param props.body - The sale option group creation payload
 * @returns The created sale option group record
 * @throws {Error} Throws error if creation fails (e.g., duplicate code)
 */
export async function post__shoppingMall_adminUser_saleOptionGroups(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSaleOptionGroup.ICreate;
}): Promise<IShoppingMallSaleOptionGroup> {
  const { adminUser, body } = props;

  const id = v4();
  const idTyped = (id satisfies string & tags.Format<"uuid">) ? id : id;
  const now = toISOStringSafe(new Date());
  const nowTyped = (now satisfies string & tags.Format<"date-time">)
    ? now
    : now;

  const created = await MyGlobal.prisma.shopping_mall_sale_option_groups.create(
    {
      data: {
        id: idTyped,
        code: body.code,
        name: body.name,
        created_at: nowTyped,
        updated_at: nowTyped,
      },
    },
  );

  return {
    id: created.id,
    code: created.code,
    name: created.name,
    created_at: created.created_at
      ? toISOStringSafe(created.created_at)
      : nowTyped,
    updated_at: created.updated_at
      ? toISOStringSafe(created.updated_at)
      : nowTyped,
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
