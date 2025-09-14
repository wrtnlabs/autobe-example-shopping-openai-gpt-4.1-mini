import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import { IPageIShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallInquiry";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Search and retrieve filtered list of product inquiries.
 *
 * This operation allows an admin user to retrieve a paginated, filtered, and
 * sorted list of product inquiries submitted by customers in the shopping mall
 * system.
 *
 * Filters include channel ID, section ID, category ID, member user ID, guest
 * user ID, parent inquiry ID, inquiry title and body substring matches, privacy
 * flags, answered flags, and status.
 *
 * Pagination parameters support page and limit. Sorting is provided via allowed
 * list of sortable columns, defaulting to 'created_at' descending.
 *
 * Soft-deleted inquiries (deleted_at != null) are excluded.
 *
 * @param props - The function props containing the adminUser payload and the
 *   IShoppingMallInquiry.IRequest body with filter and pagination criteria.
 * @returns Paginated list of inquiry summaries matching criteria.
 * @throws Error if database access fails or parameters are invalid.
 */
export async function patch__shoppingMall_adminUser_inquiries(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallInquiry.IRequest;
}): Promise<IPageIShoppingMallInquiry.ISummary> {
  const { body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const allowedSortBy = [
    "id",
    "shopping_mall_channel_id",
    "shopping_mall_section_id",
    "shopping_mall_category_id",
    "shopping_mall_memberuserid",
    "shopping_mall_guestuserid",
    "parent_inquiry_id",
    "inquiry_title",
    "is_private",
    "is_answered",
    "status",
    "created_at",
    "updated_at",
  ];

  const sortBy =
    body.sort_by && allowedSortBy.includes(body.sort_by)
      ? body.sort_by
      : "created_at";

  const sortDirection =
    body.sort_direction &&
    (body.sort_direction === "asc" || body.sort_direction === "desc")
      ? body.sort_direction
      : "desc";

  const where = {
    deleted_at: null,
    ...(body.shopping_mall_channel_id !== undefined &&
    body.shopping_mall_channel_id !== null
      ? { shopping_mall_channel_id: body.shopping_mall_channel_id }
      : {}),
    ...(body.shopping_mall_section_id !== undefined &&
    body.shopping_mall_section_id !== null
      ? { shopping_mall_section_id: body.shopping_mall_section_id }
      : {}),
    ...(body.shopping_mall_category_id !== undefined &&
    body.shopping_mall_category_id !== null
      ? { shopping_mall_category_id: body.shopping_mall_category_id }
      : {}),
    ...(body.shopping_mall_memberuserid !== undefined &&
    body.shopping_mall_memberuserid !== null
      ? { shopping_mall_memberuserid: body.shopping_mall_memberuserid }
      : {}),
    ...(body.shopping_mall_guestuserid !== undefined &&
    body.shopping_mall_guestuserid !== null
      ? { shopping_mall_guestuserid: body.shopping_mall_guestuserid }
      : {}),
    ...(body.parent_inquiry_id !== undefined && body.parent_inquiry_id !== null
      ? { parent_inquiry_id: body.parent_inquiry_id }
      : {}),
    ...(body.inquiry_title !== undefined && body.inquiry_title !== null
      ? { inquiry_title: { contains: body.inquiry_title } }
      : {}),
    ...(body.inquiry_body !== undefined && body.inquiry_body !== null
      ? { inquiry_body: { contains: body.inquiry_body } }
      : {}),
    ...(body.is_private !== undefined && body.is_private !== null
      ? { is_private: body.is_private }
      : {}),
    ...(body.is_answered !== undefined && body.is_answered !== null
      ? { is_answered: body.is_answered }
      : {}),
    ...(body.status !== undefined && body.status !== null
      ? { status: body.status }
      : {}),
  };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_inquiries.findMany({
      where,
      orderBy: { [sortBy]: sortDirection },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        shopping_mall_channel_id: true,
        inquiry_title: true,
        is_private: true,
        is_answered: true,
        status: true,
        created_at: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_inquiries.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((inq) => ({
      id: inq.id,
      shopping_mall_channel_id: inq.shopping_mall_channel_id,
      inquiry_title: inq.inquiry_title,
      is_private: inq.is_private,
      is_answered: inq.is_answered,
      status: inq.status,
      created_at: toISOStringSafe(inq.created_at),
    })),
  };
}
