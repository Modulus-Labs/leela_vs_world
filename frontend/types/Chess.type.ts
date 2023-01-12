import { BigNumber } from 'ethers';

export type ChessRow = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ChessColumn = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export const ChessColumnMapping: Record<number, ChessColumn> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D',
  4: 'E',
  5: 'F',
  6: 'G',
  7: 'H',
};

export enum ChessPiece {
  'B_ROOK',
  'B_KNIGHT',
  'B_BISHOP',
  'B_QUEEN',
  'B_KING',
  'B_PAWN',
  // ----
  'W_ROOK',
  'W_KNIGHT',
  'W_BISHOP',
  'W_QUEEN',
  'W_KING',
  'W_PAWN',
}

// Mapping from chess piece format in the contract => Frontend ChessPiece type
export const ChessPieceMapping: Record<string, ChessPiece> = {
  [BigNumber.from('0x0c').toString()]: ChessPiece.B_ROOK,
  [BigNumber.from('0x0b').toString()]: ChessPiece.B_KNIGHT,
  [BigNumber.from('0x0a').toString()]: ChessPiece.B_BISHOP,
  [BigNumber.from('0x0e').toString()]: ChessPiece.B_KING,
  [BigNumber.from('0x0d').toString()]: ChessPiece.B_QUEEN,
  [BigNumber.from('0x09').toString()]: ChessPiece.B_PAWN,
  // ---
  [BigNumber.from('0x04').toString()]: ChessPiece.W_ROOK,
  [BigNumber.from('0x03').toString()]: ChessPiece.W_KNIGHT,
  [BigNumber.from('0x02').toString()]: ChessPiece.W_BISHOP,
  [BigNumber.from('0x05').toString()]: ChessPiece.W_QUEEN,
  [BigNumber.from('0x06').toString()]: ChessPiece.W_KING,
  [BigNumber.from('0x01').toString()]: ChessPiece.W_PAWN,
};

export type ChessBoardData = {
  chessPiece: ChessPiece;
  row: ChessRow;
  column: ChessColumn;
}[];

export enum ChessPlayer {
  'LEELA' = 'Leela',
  'WORLD' = 'World',
}

export interface ChessMoveBet {
  move: string;
  amount: BigNumber;
}
