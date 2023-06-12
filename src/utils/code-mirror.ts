import { keywords, selectList } from '@/constants/code-mirror';

export function handleShowHint(cmInstance: CodeMirror.Editor) {
  const arr = Object.keys(selectList);
  const cursor = cmInstance.getCursor();
  let list = [...keywords];
  const token = cmInstance.getTokenAt(cursor);
  const upperToken = token.string.toLocaleUpperCase();
  list = list.filter((item) => item.indexOf(upperToken) === 0);
  if (arr.includes(upperToken)) {
    list = selectList[upperToken];
  }
  return {
    list,
    from: { ch: token.start, line: cursor.line },
    to: { ch: token.end, line: cursor.line },
  };
}

export default { handleShowHint };
