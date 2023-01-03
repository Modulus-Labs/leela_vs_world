import { BigNumber } from 'ethers';

export type ChessRow = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ChessColumn = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export enum ChessPiece {
  'B_ROOK_0',
  'B_ROOK_1',
  'B_KNIGHT_0',
  'B_KNIGHT_1',
  'B_BISHOP_0',
  'B_BISHOP_1',
  'B_QUEEN',
  'B_KING',
  'B_PAWN_0',
  'B_PAWN_1',
  'B_PAWN_2',
  'B_PAWN_3',
  'B_PAWN_4',
  'B_PAWN_5',
  'B_PAWN_6',
  'B_PAWN_7',
  // ----
  'W_ROOK_0',
  'W_ROOK_1',
  'W_KNIGHT_0',
  'W_KNIGHT_1',
  'W_BISHOP_0',
  'W_BISHOP_1',
  'W_QUEEN',
  'W_KING',
  'W_PAWN_0',
  'W_PAWN_1',
  'W_PAWN_2',
  'W_PAWN_3',
  'W_PAWN_4',
  'W_PAWN_5',
  'W_PAWN_6',
  'W_PAWN_7',
}

export type ChessBoardData = Record<
  ChessPiece,
  { row: ChessRow; column: ChessColumn }
>;

export enum ChessPlayer {
  'LEELA' = 'Leela',
  'WORLD' = 'World',
}

export interface ChessMoveBet {
  move: string;
  amount: BigNumber;
}
