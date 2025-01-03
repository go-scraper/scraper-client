export interface UrlItem {
    url: string;
    http_status: number;
    error: string | null;
  }
  
  export interface PaginatedUrls {
    urls: UrlItem[];
    inaccessible_urls: number;
  }
  
  export interface ScrapeResponse {
    request_id: string;
    pagination: {
      page_size: number;
      current_page: number;
      total_pages: number;
      next_page: string | null;
    };
    scraped: {
      title: string;
      html_version: string;
      headings: {};
      contains_login_form: boolean;
      total_urls: number,
      internal_urls: number,
      external_urls: number,
      paginated: PaginatedUrls;
    };
  }
  