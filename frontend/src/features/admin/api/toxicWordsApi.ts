export {
  addToxicWord,
  deleteToxicWord,
  getToxicWords,
} from '@/features/admin/api/toxic-words.api';
export { toxicWordsQueries } from '@/features/admin/api/toxic-words.queries';
export {
  useAddToxicWord,
  useDeleteToxicWord,
} from '@/features/admin/api/toxic-words.mutations';
export type {
  AddToxicWordPayload,
  GetToxicWordsParams,
  ToxicWord,
  ToxicWordsResponse,
} from '@/features/admin/api/toxic-words.api';