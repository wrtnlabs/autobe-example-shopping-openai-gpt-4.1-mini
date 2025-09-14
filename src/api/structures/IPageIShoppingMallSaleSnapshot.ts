import { IPage } from "./IPage";
import { IShoppingMallSaleSnapshot } from "./IShoppingMallSaleSnapshot";

export namespace IPageIShoppingMallSaleSnapshot {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallSaleSnapshot.ISummary[];
  };
}
