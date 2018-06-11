export const NUMBER = /([+-]?\d+(\.\d+)?)([eE][+-]?\d+)?/;
export const INTERVAL = new RegExp(`${NUMBER.source}((:${NUMBER.source})|(\\.\\.${NUMBER.source}))?`);
