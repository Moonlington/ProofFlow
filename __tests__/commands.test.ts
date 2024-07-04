import { getInsertionFunction } from '../src/ProofFlow/commands/commands.ts';
import { InsertionPlace, insertAbove, insertUnder } from "../src/ProofFlow/commands/helpers.ts";
describe('getInsertionFunction', () => {

  // Returns insertAbove function when InsertionPlace is Above
  it('should return insertAbove function when InsertionPlace is Above', () => {
    const result = getInsertionFunction(InsertionPlace.Above);
    expect(result).toBe(insertAbove);
  });

  // Returns insertUnder function when InsertionPlace is Underneath
  it('should return insertUnder function when InsertionPlace is Underneath', () => {
    const result = getInsertionFunction(InsertionPlace.Underneath);
    expect(result).toBe(insertUnder);
  });

});
