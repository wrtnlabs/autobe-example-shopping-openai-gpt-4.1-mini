import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSentimentAnalysis";
import { IPageIShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSentimentAnalysis";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_sentimentAnalysis(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSentimentAnalysis.IRequest;
}): Promise<IPageIShoppingMallSentimentAnalysis.ISummary> {
  const { adminUser, body } = props;

  const page = body.page ?? 0;
  const limit = body.limit ?? 10;

  // Validate orderBy and orderDirection, default to 'created_at' and 'desc'
  const validOrderColumns = [
    "sentiment_score",
    "analysis_date",
    "created_at",
    "updated_at",
  ];

  const orderBy =
    typeof body.orderBy === "string" && validOrderColumns.includes(body.orderBy)
      ? body.orderBy
      : "created_at";

  const orderDirection =
    body.orderDirection &&
    ["asc", "desc"].includes(body.orderDirection.toLowerCase())
      ? body.orderDirection.toLowerCase()
      : "desc";

  // Build sentiment_score filter
  const sentimentScoreFilter: {
    gte?: number;
    lte?: number;
  } = {};

  if (
    body.sentiment_score_min !== undefined &&
    body.sentiment_score_min !== null
  ) {
    sentimentScoreFilter.gte = body.sentiment_score_min;
  }
  if (
    body.sentiment_score_max !== undefined &&
    body.sentiment_score_max !== null
  ) {
    sentimentScoreFilter.lte = body.sentiment_score_max;
  }

  // Build where clause
  const whereConditions: {
    deleted_at: null;
    product_id?: string;
    user_id?: string | null;
    sentiment_category?: { contains: string };
    sentiment_score?: {
      gte?: number;
      lte?: number;
    };
    analysis_date?: {
      gte?: string & tags.Format<"date-time">;
      lte?: string & tags.Format<"date-time">;
    };
  } = {
    deleted_at: null,
    ...(body.product_id !== undefined && body.product_id !== null
      ? { product_id: body.product_id }
      : {}),
    ...(body.user_id !== undefined ? { user_id: body.user_id } : {}),
    ...(body.sentiment_category !== undefined &&
    body.sentiment_category !== null
      ? { sentiment_category: { contains: body.sentiment_category } }
      : {}),
    ...(Object.keys(sentimentScoreFilter).length > 0
      ? { sentiment_score: sentimentScoreFilter }
      : {}),
    ...((body.analysis_date_from !== undefined &&
      body.analysis_date_from !== null) ||
    (body.analysis_date_to !== undefined && body.analysis_date_to !== null)
      ? {
          analysis_date: {
            ...(body.analysis_date_from !== undefined &&
            body.analysis_date_from !== null
              ? { gte: body.analysis_date_from }
              : {}),
            ...(body.analysis_date_to !== undefined &&
            body.analysis_date_to !== null
              ? { lte: body.analysis_date_to }
              : {}),
          },
        }
      : {}),
  };

  // Fetch records and total count concurrently
  const [records, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sentiment_analysis.findMany({
      where: whereConditions,
      orderBy: { [orderBy]: orderDirection },
      skip: page * limit,
      take: limit,
      select: {
        id: true,
        product_id: true,
        sentiment_score: true,
        sentiment_category: true,
        analysis_date: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_sentiment_analysis.count({
      where: whereConditions,
    }),
  ]);

  // Using typia.assertGuard to safely brand the fields
  typia.assertGuard<string & tags.Format<"uuid">>(records[0]?.id ?? v4());
  typia.assertGuard<string & tags.Format<"uuid">>(
    records[0]?.product_id ?? v4(),
  );

  // Map results with date conversions
  const data = records.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    sentiment_score: r.sentiment_score,
    sentiment_category: r.sentiment_category,
    analysis_date: toISOStringSafe(r.analysis_date),
  }));

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data,
  };
}
