import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteInquiry";
import { IPageIShoppingMallFavoriteInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallFavoriteInquiry";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Search and retrieve filtered, paginated list of favorite inquiries for
 * authenticated member users.
 *
 * This operation allows members to manage their favorite inquiries with
 * pagination and sorting.
 *
 * @param props - The properties object containing memberUser authentication and
 *   request filter/pagination body
 * @param props.memberUser - The authenticated member user payload
 * @param props.body - The request body containing filtering and pagination
 *   options
 * @returns A paginated summary list of the favorite inquiries matching the
 *   filter criteria
 * @throws Will throw an error if unauthorized or if database operations fail
 */
export async function patch__shoppingMall_memberUser_favoriteInquiries(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallFavoriteInquiry.IRequest;
}): Promise<IPageIShoppingMallFavoriteInquiry.ISummary> {
  const { memberUser, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;
  const orderByField = body.orderBy ?? "created_at";

  const whereCondition = {
    shopping_mall_memberuser_id: memberUser.id,
    deleted_at: null,
  };

  const [records, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_favorite_inquiries.findMany({
      where: whereCondition,
      orderBy: { [orderByField]: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        shopping_mall_inquiry_snapshot_id: true,
        created_at: true,
      },
    }),

    MyGlobal.prisma.shopping_mall_favorite_inquiries.count({
      where: whereCondition,
    }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: records.map((record) => ({
      id: record.id,
      shopping_mall_inquiry_snapshot_id:
        record.shopping_mall_inquiry_snapshot_id,
      created_at: toISOStringSafe(record.created_at),
    })),
  };
}
