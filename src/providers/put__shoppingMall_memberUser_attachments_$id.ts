import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAttachments } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAttachments";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update metadata for an existing attachment record specified by its UUID.
 *
 * Only metadata fields such as file name, URL, media type, file size, and
 * upload IP can be updated. Immutable fields like ID or creation timestamps
 * cannot be changed.
 *
 * Requires memberUser role authentication.
 *
 * @param props - Object containing memberUser authentication, attachment ID,
 *   and update body
 * @param props.memberUser - The authenticated member user performing the update
 * @param props.id - UUID of the attachment to update
 * @param props.body - Partial record containing fields to update
 * @returns Updated attachment record with all metadata fields
 * @throws Error if the attachment with given ID does not exist
 */
export async function put__shoppingMall_memberUser_attachments_$id(props: {
  memberUser: MemberuserPayload;
  id: string & tags.Format<"uuid">;
  body: IShoppingMallAttachments.IUpdate;
}): Promise<IShoppingMallAttachments> {
  const { memberUser, id, body } = props;

  // Confirm attachment exists
  await MyGlobal.prisma.shopping_mall_attachments.findUniqueOrThrow({
    where: { id },
  });

  // Update attachment metadata
  const updated = await MyGlobal.prisma.shopping_mall_attachments.update({
    where: { id },
    data: {
      file_name: body.file_name ?? undefined,
      file_url: body.file_url ?? undefined,
      media_type: body.media_type ?? undefined,
      file_size: body.file_size ?? undefined,
      upload_ip: body.upload_ip ?? undefined,
    },
  });

  return {
    id: updated.id,
    file_name: updated.file_name,
    file_url: updated.file_url,
    media_type: updated.media_type,
    file_size: updated.file_size,
    upload_ip: updated.upload_ip ?? null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
