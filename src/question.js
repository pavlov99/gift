import Block from './block';

export default class Question {
  static splitBlocks(question) {
    // Apply simple regexps first and then if candidate is not qualified - merge
    // it with text on the left and right.
    // NOTES: (Negative) lookbehind is not supported by JavaScript yet. It is a
    // part of ES2018 proposal.
    // More info about lookbehind: http://2ality.com/2017/05/regexp-lookbehind-assertions.html
    // There is a possible way to replace lookabehind wiht lookahead on the
    // reversed string: https://stackoverflow.com/questions/641407/javascript-negative-lookbehind-equivalent#answer-11347100
    // return question.split(/(?<!\\)({[^}]*(?<!\\)})/g).filter(x => x)
    return question
      .split(/({[^}]*})/g)
      .filter(x => x);
  }

  static mask(question) {
    return this.splitBlocks(question)
      .map((blockText) => {
        try {
          return Block.fromString(blockText).toMaskedString();
        } catch (err) {
          // I want application to not crush, but don't care about the message
        }
        return blockText;
      })
      .join('');
  }
}
