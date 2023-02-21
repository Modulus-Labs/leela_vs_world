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
export function convertMoveToUint16Repr(fromRow: string, fromCol: number, toRow: string, toCol: number): number {
  const fromRowRepr = fromRow.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
  const fromColRepr = fromCol - 1;
  const toRowRepr = toRow.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
  const toColRepr = toCol - 1;
  return (fromColRepr << 9) | (fromRowRepr << 6) | (toColRepr << 3) | (toRowRepr);
}

/**
 * Converts uint16 move repr back into human-readable format.
 * @param uint16MoveRepr 
 * @returns 
 */
export function convertUint16ReprToMoveStrings(uint16MoveRepr: number): [Square, Square] {
  const toRow = uint16MoveRepr & 0x7;
  const toCol = (uint16MoveRepr >> 3) & 0x7;
  const fromRow = (uint16MoveRepr >> 6) & 0x7;
  const fromCol = (uint16MoveRepr >> 9) & 0x7;
  return [
    String.fromCharCode("a".charCodeAt(0) + fromRow) + `${fromCol + 1}` as Square,
    String.fromCharCode("a".charCodeAt(0) + toRow) + `${toCol + 1}` as Square
  ];
}

/**
 * Returns the contract move representation notation.
 * @param moveFrom
 * @param moveTo
 * @returns 
 */
export function getContractMoveRepr(moveFrom: Square, moveTo: Square): number {
  const fromRowRepr = moveFrom.charCodeAt(0) - "a".charCodeAt(0);
  const fromColRepr = Number(moveFrom.charAt(1)) - 1;
  const toRowRepr = moveTo.charCodeAt(0) - "a".charCodeAt(0);
  const toColRepr = Number(moveTo.charAt(1)) - 1;
  const moveRepr = (fromColRepr << 9) | (fromRowRepr << 6) | (toColRepr << 3) | (toRowRepr);
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