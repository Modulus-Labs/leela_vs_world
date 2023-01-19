import { BigNumber } from 'ethers';
import { Square } from 'chess.js';

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
}

export interface MovingBoardState {
  fen: string;
  moveState: MOVE_STATE.MOVING;
  moveFrom: Square;
  moveTo: null;
  validMoves: Square[];
}

export interface MovedBoardState {
  fen: string;
  moveState: MOVE_STATE.MOVED;
  moveFrom: Square;
  moveTo: Square;
  validMoves: null;
}

export type BoardState = IdleBoardState | MovingBoardState | MovedBoardState;
