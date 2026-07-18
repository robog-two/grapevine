export type ChangeType = 'created' | 'updated' | 'deleted' | 'restored' | 'merged';
export type ItemType = 'note' | 'photo' | 'file' | 'eml' | 'reminder' | 'link';
export type FieldType = 'text' | 'date' | 'select' | 'checkbox' | 'link' | 'currency';

export interface ContactRow {
  label: string;
  value: string;
}

export type ItemContent =
  | { type: 'note'; text: string }
  | { type: 'photo'; caption?: string }
  | { type: 'file'; filename: string; mime: string; size: number }
  | { type: 'eml'; from: string; subject: string; date: string; bodyText: string }
  | { type: 'reminder'; note?: string }
  | { type: 'link'; url: string; title: string };
