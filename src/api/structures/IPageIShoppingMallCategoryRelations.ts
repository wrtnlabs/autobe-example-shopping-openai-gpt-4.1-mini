import { IPage } from "./IPage";
import { IShoppingMallCategoryRelations } from "./IShoppingMallCategoryRelations";

export namespace IPageIShoppingMallCategoryRelations {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallCategoryRelations.ISummary[];
  };
}
