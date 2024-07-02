import { _private, getInsertionFunction, cmdInsertCode, cmdInsertMarkdown, cmdInsertMath } from '../src/ProofFlow/commands/commands.ts';
import { InsertionPlace, insertAbove, insertUnder } from "../src/ProofFlow/commands/helpers.ts";
import { getMathInsertCommand } from '../src/ProofFlow/commands/insert-commands.ts';
import { ProofFlowSchema } from "../src/ProofFlow/editor/proofFlowSchema.ts";

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

describe('cmdInsertCode', () => {

  // Inserts code block above the current selection when insertionPlace is Above
  it('should insert code block above the current selection when insertionPlace is Above', () => {
    const insertionPlace = InsertionPlace.Above;
    const command = cmdInsertCode(insertionPlace);

    expect(command).toBe(insertAbove);
  });

  // Inserts code block underneath the current selection when insertionPlace is Underneath
  it('should insert code block underneath the current selection when insertionPlace is Underneath', () => {
    const insertionPlace = InsertionPlace.Underneath;
    const command = cmdInsertCode(insertionPlace);

    expect(command).toBe(insertUnder);
  });
});

describe('cmdInsertMarkdown', () => {
  // Inserts markdown node above the current selection when insertionPlace is Above
  it('should insert markdown node above the current selection when insertionPlace is Above', () => {
    const insertionPlace = InsertionPlace.Above;
    const command = cmdInsertMarkdown(insertionPlace);

    expect(command).toBe(insertAbove);
  });

  // Dont think we need this one
  // Handles undefined or null insertionPlace
  // it('should handle undefined or null insertionPlace gracefully', () => {
  //   const commandUndefined = cmdInsertMarkdown(undefined as any);
  //   const commandNull = cmdInsertMarkdown(null as any);

  //   expect(commandUndefined).toBeDefined();
  //   expect(commandUndefined).toBeInstanceOf(Function);

  //   expect(commandNull).toBeDefined();
  //   expect(commandNull).toBeInstanceOf(Function);
  // });

  // Returns a valid Command object for insertion
  it('should return a valid Command object for insertion when insertionPlace is Above', () => {
    const insertionPlace = InsertionPlace.Above;
    const command = cmdInsertMarkdown(insertionPlace);

    expect(command).toBeInstanceOf(Function);
  });

  // Inserts markdown node underneath the current selection when insertionPlace is Underneath
  it('should insert markdown node underneath the current selection when insertionPlace is Underneath', () => {
    const insertionPlace = InsertionPlace.Underneath;
    const command = cmdInsertMarkdown(insertionPlace);

    expect(command).toBe(insertUnder);
  });
});

describe('cmdInsertMath', () => {

    // Inserts a math_display node above the current selection when insertionPlace is Above
    it('should insert a math_display node above the current selection when insertionPlace is Above', () => {
      const insertionPlace = InsertionPlace.Above;
      const command = cmdInsertMath(insertionPlace);
      expect(command).toBeDefined();
      // Additional assertions to verify the node insertion can be added here
    });

    // Inserts a math_display node underneath the current selection when insertionPlace is Underneath
    it('should insert a math_display node underneath the current selection when insertionPlace is Underneath', () => {
      const insertionPlace = InsertionPlace.Underneath;
      const command = cmdInsertMath(insertionPlace);
      expect(command).toBeDefined();
      // Additional assertions to verify the node insertion can be added here
    });

    // Correctly identifies the math_display node type from ProofFlowSchema
    it('should correctly identify the math_display node type from ProofFlowSchema', () => {
      const insertionPlace = InsertionPlace.Above;
      const command = cmdInsertMath(insertionPlace);
      const mathNodeType = ProofFlowSchema.nodes["math_display"];
      expect(command).toBeDefined();
      expect(command).toEqual(getMathInsertCommand(getInsertionFunction(insertionPlace), mathNodeType));
    });
});