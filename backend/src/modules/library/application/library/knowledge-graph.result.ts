export interface KnowledgeGraphNodeResult {
  id: string;
  label: string;
  type: 'user' | 'book' | 'genre' | 'author' | 'tag';
  val: number;
  img?: string;
  color?: string;
  isGap?: boolean;
  reason?: string;
  slug?: string;
  url?: string;
}

export interface KnowledgeGraphLinkResult {
  source: string;
  target: string;
  type: 'read' | 'belongs_to' | 'written_by' | 'has_tag' | 'semantic';
}

export interface KnowledgeGraphResult {
  nodes: KnowledgeGraphNodeResult[];
  links: KnowledgeGraphLinkResult[];
}
