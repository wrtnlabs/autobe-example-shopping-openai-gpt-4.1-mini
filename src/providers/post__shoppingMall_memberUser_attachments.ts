import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAttachments } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAttachments";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Create a new attachment metadata record representing an uploaded file.
 *
 * This function creates a record in the shopping_mall_attachments table with
 * provided metadata including file name, URL, media type, file size, and
 * optional upload IP. It automatically generates a unique UUID and timestamps
 * for creation and update.
 *
 * @param props - Object containing memberUser payload and attachment creation
 *   data
 * @param props.memberUser - Authenticated member user performing the operation
 * @param props.body - Attachment metadata conforming to
 *   IShoppingMallAttachments.ICreate
 * @returns The newly created attachment record with full fields including id
 *   and timestamps
 * @throws {Error} Throws if the database operation fails
 */
export async function post__shoppingMall_memberUser_attachments(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallAttachments.ICreate;
}): Promise<IShoppingMallAttachments> {
  const { memberUser, body } = props;

  const id = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_attachments.create({
    data: {
      id: id,
      file_name: body.file_name,
      file_url: body.file_url,
      media_type: body.media_type,
      file_size: body.file_size,
      upload_ip: body.upload_ip ?? undefined,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id as string & tags.Format<"uuid">,
    file_name: created.file_name,
    file_url: created.file_url,
    media_type: created.media_type,
    file_size: created.file_size,
    upload_ip: created.upload_ip ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}
