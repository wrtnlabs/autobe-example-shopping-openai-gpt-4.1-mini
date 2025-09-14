import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import { IPageIShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleUnit";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function patch__shoppingMall_sellerUser_sales_$saleId_saleUnits(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnit.IRequest;
}): Promise<IPageIShoppingMallSaleUnit.ISummary> {
  const { sellerUser, saleId, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;
  const search = body.search ?? null;
  const sortBy = body.sortBy ?? "created_at";
  const order = body.order ?? "desc";

  const whereConditions = {
    shopping_mall_sale_id: saleId,
    deleted_at: null,
  };

  const orConditions =
    search !== null
      ? [{ code: { contains: search } }, { name: { contains: search } }]
      : [];

  const fullWhere =
    orConditions.length > 0
      ? { ...whereConditions, OR: orConditions }
      : whereConditions;

  const validSortFields = ["code", "name", "created_at", "updated_at"] as const;

  const orderBy = validSortFields.includes(sortBy as any)
    ? ({ [sortBy]: order } as Record<typeof sortBy, "asc" | "desc">)
    : { created_at: "desc" };

  const skip = (page - 1) * limit;

  const [units, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sale_units.findMany({
      where: fullWhere,
      orderBy: orderBy as unknown as
        | {
            code?: "asc" | "desc" | undefined;
            name?: "asc" | "desc" | undefined;
            created_at?: "asc" | "desc" | undefined;
            updated_at?: "asc" | "desc" | undefined;
          }
        | {
            code?: "asc" | "desc" | undefined;
            name?: "asc" | "desc" | undefined;
            created_at?: "asc" | "desc" | undefined;
            updated_at?: "asc" | "desc" | undefined;
          }[],
      skip,
      take: limit,
      select: {
        id: true,
        shopping_mall_sale_id: true,
        code: true,
        name: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_sale_units.count({ where: fullWhere }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: units.map((unit) => ({
      id: typia.assert<string & tags.Format<"uuid">>(unit.id),
      shopping_mall_sale_id: typia.assert<string & tags.Format<"uuid">>(
        unit.shopping_mall_sale_id,
      ),
      code: unit.code,
      name: unit.name,
      description: unit.description ?? null,
      created_at: toISOStringSafe(unit.created_at),
      updated_at: toISOStringSafe(unit.updated_at),
    })),
  };
}
