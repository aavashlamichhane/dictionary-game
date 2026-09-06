declare module 'wordnet' {
  interface WordNetResult {
    glossary: string;
    meta?: {
      synsetType?: string;
      words?: string[];
      [key: string]: any;
    };
  }

  function init(): Promise<void>;
  function lookup(word: string): Promise<WordNetResult[]>;
  function list(): Promise<string[]>;

  const wordnet: {
    init: typeof init;
    lookup: typeof lookup;
    list: typeof list;
  };

  export default wordnet;
}
