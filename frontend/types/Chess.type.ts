import { Chess, Square } from 'chess.js';

export interface ChessLeaderboardMove {
  humanRepr: string;
  stake: number;
  ID: number;
}

export enum MOVE_STATE {
  IDLE,
  MOVING,
  MOVED,
}

export interface IdleBoardState {
  fen: string;
  moveState: MOVE_STATE.IDLE;
  moveFrom: null;
  moveTo: null;
  validMoves: null;
  chessGame: Chess;
}

export interface MovingBoardState {
  fen: string;
  moveState: MOVE_STATE.MOVING;
  moveFrom: Square;
  moveTo: null;
  validMoves: Square[];
  chessGame: Chess;
}

export interface MovedBoardState {
  fen: string;
  moveState: MOVE_STATE.MOVED;
  moveFrom: Square;
  moveTo: Square;
  validMoves: null;
  chessGame: Chess;
}

export type BoardState = IdleBoardState | MovingBoardState | MovedBoardState;

export enum CHESS_PLAYER {
  LEELA = 'leela',
  WORLD = 'world',
}
