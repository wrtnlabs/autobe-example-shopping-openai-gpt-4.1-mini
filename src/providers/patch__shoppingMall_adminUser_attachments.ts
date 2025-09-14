import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAttachment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAttachment";
import { IPageIShoppingMallAttachment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallAttachment";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_attachments(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallAttachment.IRequest;
}): Promise<IPageIShoppingMallAttachment> {
  const { body } = props;
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const where = {
    deleted_at: null,
    ...(body.media_type !== undefined &&
      body.media_type !== null && { media_type: body.media_type }),
    ...(body.min_file_size !== undefined &&
      body.min_file_size !== null && {
        file_size: { gte: body.min_file_size },
      }),
    ...(body.max_file_size !== undefined &&
      body.max_file_size !== null && {
        file_size: { lte: body.max_file_size },
      }),
    ...(body.search !== undefined &&
      body.search !== null && {
        OR: [
          { file_name: { contains: body.search } },
          { file_url: { contains: body.search } },
        ],
      }),
  };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_attachments.findMany({
      where,
      orderBy:
        body.sortBy && body.sortDirection
          ? { [body.sortBy]: body.sortDirection }
          : { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_attachments.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((item) => ({
      id: item.id,
      file_name: item.file_name,
      file_url: item.file_url,
      media_type: item.media_type,
      file_size: item.file_size,
      upload_ip: item.upload_ip ?? null,
      created_at: toISOStringSafe(item.created_at),
      updated_at: toISOStringSafe(item.updated_at),
      deleted_at: item.deleted_at ? toISOStringSafe(item.deleted_at) : null,
    })),
  };
}
