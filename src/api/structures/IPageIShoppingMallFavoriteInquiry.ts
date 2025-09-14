import { IPage } from "./IPage";
import { IShoppingMallFavoriteInquiry } from "./IShoppingMallFavoriteInquiry";

export namespace IPageIShoppingMallFavoriteInquiry {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallFavoriteInquiry.ISummary[];
  };
}
