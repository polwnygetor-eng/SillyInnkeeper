export interface CardListItem {
  id: string;
  name: string | null;
  tags: string[] | null;
  creator: string | null;
  avatar_url: string;
  file_path: string | null;
}
