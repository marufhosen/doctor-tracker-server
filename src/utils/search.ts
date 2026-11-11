const regexSpecialCharacters = /[.*+?^${}()|[\]\\]/g;

export const createPartialMatch = (value: string): RegExp =>
  new RegExp(value.replace(regexSpecialCharacters, '\\$&'), 'i');
