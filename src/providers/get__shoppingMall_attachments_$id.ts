import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAttachments } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAttachments";

/**
 * Retrieve an attachment's metadata by ID.
 *
 * This operation fetches the detailed metadata of an attachment file identified
 * by its UUID. The information returned includes file name, file URL (generally
 * a CDN path), media type, file size in bytes, optional upload IP address, and
 * timestamps for creation, update, and logical deletion.
 *
 * This is a public read-only operation with no authorization requirement.
 *
 * @param props - Object containing the UUID of the attachment to retrieve
 * @param props.id - UUID of the attachment
 * @returns Attachment metadata conforming to IShoppingMallAttachments
 * @throws {Error} Throws if attachment with specified ID does not exist
 */
export async function get__shoppingMall_attachments_$id(props: {
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallAttachments> {
  const { id } = props;
  const found =
    await MyGlobal.prisma.shopping_mall_attachments.findUniqueOrThrow({
      where: { id },
    });

  return {
    id: found.id,
    file_name: found.file_name,
    file_url: found.file_url,
    media_type: found.media_type,
    file_size: found.file_size,
    upload_ip: found.upload_ip ?? null,
    created_at: toISOStringSafe(found.created_at),
    updated_at: toISOStringSafe(found.updated_at),
    deleted_at: found.deleted_at ? toISOStringSafe(found.deleted_at) : null,
  };
}
