import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Delete a seller response by ID
 *
 * This operation permanently deletes a seller response record from the
 * database. Authorization is enforced to allow only the seller user who owns
 * the response to delete it.
 *
 * @param props - Object containing the authenticated seller user and the seller
 *   response ID
 * @param props.sellerUser - The authenticated seller user payload
 * @param props.id - The UUID of the seller response to delete
 * @throws {Error} Throws if the seller response is not found or if the user is
 *   unauthorized
 */
export async function delete__shoppingMall_sellerUser_sellerResponses_$id(props: {
  sellerUser: SelleruserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sellerUser, id } = props;

  // Retrieve the seller response from the database
  const sellerResponse =
    await MyGlobal.prisma.shopping_mall_seller_responses.findUniqueOrThrow({
      where: { id },
    });

  // Check if the seller user owns the response
  if (sellerResponse.shopping_mall_selleruserid !== sellerUser.id) {
    throw new Error(
      "Unauthorized: You can only delete your own seller responses",
    );
  }

  // Perform hard delete
  await MyGlobal.prisma.shopping_mall_seller_responses.delete({
    where: { id },
  });
}
