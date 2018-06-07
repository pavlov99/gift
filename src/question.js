import Block from './block';

export default class Question {
  static splitBlocksWithPredicate(question, predicate) {
    // Apply simple regexps first and then if candidate is not qualified - merge
    // it with text on the left and right.
    // NOTES: (Negative) lookbehind is not supported by JavaScript yet. It is a
    // part of ES2018 proposal.
    // More info about lookbehind: http://2ality.com/2017/05/regexp-lookbehind-assertions.html
    // There is a possible way to replace lookabehind wiht lookahead on the
    // reversed string: https://stackoverflow.com/questions/641407/javascript-negative-lookbehind-equivalent#answer-11347100
    // return question.split(/(?<!\\)({[^}]*(?<!\\)})/g).filter(x => x)

    const blocks = [];
    let isValid = true;

    question
      .split(/({[^}]*})/g)
      .filter(x => x)
      .forEach((candidate) => {
        // If previous block is valid OR this is the first block, append candidate
        if (isValid) {
          blocks.push(candidate);
          isValid = predicate(candidate);
        } else if (predicate(candidate)) {
          // Candidate is valid
          blocks.push(candidate);
          isValid = true;
        } else {
          // Previous block is not GIFT and current is also not GIFT.
          // If both are GIFT - no need to concatenate as that is valid.
          blocks.push(blocks.pop().concat(candidate));
        }
      });

    return blocks;
  }

  static splitBlocks(question) {
    return Question.splitBlocksWithPredicate(question, Block.isValid);
  }

  static splitMaskedBlocks(question) {
    return Question.splitBlocksWithPredicate(question, Block.isValidMasked);
  }

  static mask(question) {
    return Question.splitBlocks(question)
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
