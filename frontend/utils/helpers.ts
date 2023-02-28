import { BoardState } from "../types/Chess.type";
import { Chess, Square } from 'chess.js';

/**
 * Given chess move in e.g. "A2A4" format, converts into chess game-parseable repr.
 * @param fromRow 
 * @param fromCol 
 * @param toRow 
 * @param toCol 
 * @returns 
 */
export function convertMoveToUint16Repr(fromCol: string, fromRow: number, toCol: string, toRow: number): number {
  const fromColRepr = 7 - (fromCol.toUpperCase().charCodeAt(0) - "A".charCodeAt(0));
  const fromRowRepr = fromRow - 1;
  const toColRepr = 7 - (toCol.toUpperCase().charCodeAt(0) - "A".charCodeAt(0));
  const toRowRepr = toRow - 1;
  return (fromRowRepr << 9) | (fromColRepr << 6) | (toRowRepr << 3) | (toColRepr);
}

/**
 * Converts uint16 move repr back into human-readable format.
 * @param uint16MoveRepr 
 * @returns 
 */
export function convertUint16ReprToMoveStrings(uint16MoveRepr: number): [Square, Square] {
  const toCol = 7 - (uint16MoveRepr & 0x7);
  const toRow = (uint16MoveRepr >> 3) & 0x7;
  const fromCol = 7 - ((uint16MoveRepr >> 6) & 0x7);
  const fromRow = (uint16MoveRepr >> 9) & 0x7;
  return [
    String.fromCharCode("a".charCodeAt(0) + fromCol) + `${fromRow + 1}` as Square,
    String.fromCharCode("a".charCodeAt(0) + toCol) + `${toRow + 1}` as Square
  ];
}

/**
 * Converts a single square int (for en passant) back into a human-readable move
 * (e.g. "E4")
 * @param uint16SquareRepr 
 * @returns 
 */
export function convertUint16SquareToHumanRepr(uint16SquareRepr: number): Square {
  const col = 7 - (uint16SquareRepr & 0x7);
  const row = (uint16SquareRepr >> 3) & 0x7;
  return String.fromCharCode("a".charCodeAt(0) + col) + `${row + 1}` as Square;
}

/**
 * Returns the contract move representation notation.
 * @param moveFrom
 * @param moveTo
 * @returns 
 */
export function getContractMoveRepr(moveFrom: Square, moveTo: Square): number {
  const fromColRepr = 7 - (moveFrom.charCodeAt(0) - "a".charCodeAt(0));
  const fromRowRepr = Number(moveFrom.charAt(1)) - 1;
  const toColRepr = 7 - (moveTo.charCodeAt(0) - "a".charCodeAt(0));
  const toRowRepr = Number(moveTo.charAt(1)) - 1;
  console.log(`Move from: ${moveFrom}`);
  console.log(`Move to: ${moveTo}`);
  console.log(`From col repr: ${fromColRepr}`);
  console.log(`From row repr: ${fromRowRepr}`);
  console.log(`To col repr: ${toColRepr}`);
  console.log(`To row repr: ${toRowRepr}`);
  const moveRepr = (fromRowRepr << 9) | (fromColRepr << 6) | (toRowRepr << 3) | (toColRepr);
  console.log(`Here is the contract move repr: ${moveRepr}`);
  return moveRepr;
}

/**
 * Returns the human-readable standard algebraic format for moving from
 * `moveFrom` to `moveTo` given the board state represented by `fen`.
 * @param moveFrom 
 * @param moveTo 
 * @param chess
 * @returns 
 */
export const getAlgebraicNotation = (moveFrom: Square, moveTo: Square, chess: Chess) => {

  if (moveTo == null) {
    return "";
  } else if (moveFrom == null) {
    return "";
  } else {

    const fromPiece = chess.get(moveFrom);
    const toPiece = chess.get(moveTo);

    if (!fromPiece || fromPiece === undefined) {
      return "";
    }

    // --- Check for castle ---
    if (fromPiece.type === "k") {
      if (fromPiece.color === "b") {
        if (moveFrom === "e8" && moveTo === "g8") {
          return "O-O";
        }
        if (moveFrom === "e8" && moveTo === "c8") {
          return "O-O-O";
        }
      } else {
        if (moveFrom === "e1" && moveTo === "g1") {
          return "O-O";
        }
        if (moveFrom === "e1" && moveTo === "c1") {
          return "O-O-O";
        }
      }
    }

    if (!toPiece || toPiece.type === undefined) {
      // --- Check for pawn ---
      if (fromPiece.type.toUpperCase() === "P") {
        return moveTo;
      }
      return fromPiece.type.toUpperCase() + moveTo;
    } else {
      // --- Pawn ---
      if (fromPiece.type.toUpperCase() === "P") {
        return moveFrom[0].toLowerCase() + "x" + moveTo;
      }
      return fromPiece.type.toUpperCase() + 'x' + moveTo;
    }
  }
}