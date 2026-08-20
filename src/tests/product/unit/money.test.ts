import { describe, expect, it } from "vitest";
import { ValidationError } from "@shared/domain/errors";
import { Money } from "@shared/domain/money";

describe("Money", () => {
  it("rounds to cents", () => {
    expect(new Money(10.129).amount).toBe(10.13);
  });

  it("rejects negative amounts", () => {
    expect(() => new Money(-1)).toThrow(ValidationError);
  });

  it("adds amounts of the same currency", () => {
    expect(new Money(2.5).add(new Money(1.25)).amount).toBe(3.75);
  });

  it("rejects adding different currencies", () => {
    expect(() => new Money(1, "USD").add(new Money(1, "EUR"))).toThrow(
      ValidationError,
    );
  });

  it("multiplies by a quantity", () => {
    expect(new Money(9.99).multiply(2).amount).toBe(19.98);
  });

  it("compares equality", () => {
    expect(new Money(10).equals(new Money(10))).toBe(true);
    expect(new Money(10).equals(new Money(10.01))).toBe(false);
  });
});
