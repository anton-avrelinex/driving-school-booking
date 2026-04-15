export type TypesAreEqual<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : false
  : false;

export type AssertTrue<_T extends true> = true;
