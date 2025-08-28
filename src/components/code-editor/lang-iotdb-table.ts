import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
import { schemaCompletionSource, keywordCompletionSource, sql, SQLDialect } from '@codemirror/lang-sql';
import { basicSetup } from 'codemirror';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import type { CompletionContext } from '@codemirror/autocomplete';
import { tableKeywords, tableSelectList } from '@/constants/code-mirror';

const IotdbKeywords = `${tableKeywords.join(' ')} ENCODING PLAIN RLE TS_2DIFF GORILLA FREQ ZIGZAG UNCOMPRESSED SNAPPY LZ4 GZIP MAX_POINT_NUMBER DEADBAND SDT COMPDEV COMPMINTIME COMPMAXTIME`;
const IotdbTypes = 'BOOLEAN INT32 INT64 FLOAT DOUBLE TEXT DATE TIMESTAMP BLOB STRING';
const IotdbBuiltin = 'TIME TIMESTAMP AND OR NOT NULL CONTAINS';

export const IotdbSQL = SQLDialect.define({
  operatorChars: '*+-%<>!=&|^',
  charSetCasts: true,
  doubleQuotedStrings: true,
  unquotedBitLiterals: true,
  hashComments: false,
  spaceAfterDashes: true,
  specialVar: '@?',
  identifierQuotes: '"',
  keywords: IotdbKeywords.toLocaleLowerCase(),
  types: IotdbTypes.toLocaleLowerCase(),
  builtin: IotdbBuiltin.toLocaleLowerCase(),
});

export const sqlExamplesCompletions = (context: CompletionContext) => {
  const before = context.matchBefore(/\w+/);
  if (!context.explicit && !before) return null;
  const arr = Object.keys(tableSelectList);
  const upperToken = before?.text.toLocaleUpperCase().trim() || '';
  if (arr.includes(upperToken)) {
    return {
      options: tableSelectList[upperToken]!.map((item: string) => ({
        label: item,
        type: 'text',
      })),
      from: before ? before.from : context.pos,
    };
  }
  return null;
};

export const IotdbSQLConfig = {
  dialect: IotdbSQL,
  upperCaseKeywords: true,
};

export const IOTDB_EXTENSIONS = [
  basicSetup,
  keymap.of(defaultKeymap),
  sql(IotdbSQLConfig),
  syntaxHighlighting(defaultHighlightStyle),
  autocompletion({ override: [schemaCompletionSource(IotdbSQLConfig), keywordCompletionSource(IotdbSQL, true), sqlExamplesCompletions] }),
];
