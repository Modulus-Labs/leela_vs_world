import { BoardState } from "../types/Chess.type";
import { Square } from 'chess.js';

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
export function convertUint16ReprToMoveStrings(uint16MoveRepr: number): [string, string] {
  const toRow = uint16MoveRepr & 0x7;
  const toCol = (uint16MoveRepr >> 3) & 0x7;
  const fromRow = (uint16MoveRepr >> 6) & 0x7;
  const fromCol = (uint16MoveRepr >> 9) & 0x7;
  return [
    String.fromCharCode("a".charCodeAt(0) + fromRow) + `${fromCol + 1}`,
    String.fromCharCode("a".charCodeAt(0) + toRow) + `${toCol + 1}`
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
 * @param fen 
 * @returns 
 */
export const getAlgebraicNotation = (moveFrom: string | null, moveTo: string | null, fen: string) => {
  //function to replace number in fen with empty space
  const convertFenWithEmpty = () => {
    let pieces = fen.split(' ')[0];
    for (let i = 0; i < pieces.length; i++) {
      const nums = ['2', '3', '4', '5', '6', '7', '8'];
      if (nums.includes(pieces.charAt(i))) {
        let empty = '';
        for (let j = 0; j < parseInt(pieces.charAt(i)); j++)
          empty += ' ';
        if (i == pieces.length - 1)
          pieces = pieces.substring(0, i) + empty;
        else
          pieces = pieces.substring(0, i) + empty + pieces.substring(i + 1);
        i -= 1;
      }
    }
    return pieces.split('/');
  };

  //function that gets the chess position based on the ith, jth square it is in
  const convertIntToPosition = (i: number, j: number) => {
    return String.fromCharCode(97 + j) + (8 - i).toString();
  }

  //function that gets all of the positions of a given piece, excluding the given one
  const getPositionOfPiece = (piece: string, fromPos: string) => {
    const piecesArr = convertFenWithEmpty();
    // console.log(convertIntToPosition(0,0));
    let ret = [];
    for (let i = 0; i < piecesArr.length; i++)
      for (let j = 0; j < 8; j++)
        if (piecesArr[i].charAt(j) == piece) {
          var val = convertIntToPosition(i, j);
          if (val != fromPos)
            ret.push(convertIntToPosition(i, j));
        }
    return ret;
  }

  if (moveTo == null)
    return ' ';
  else if (moveFrom == null)
    return ' ';
  else {
    const piecesArr = convertFenWithEmpty();
    let fromPiece = piecesArr[8 - parseInt(moveFrom.charAt(1))].charAt(moveFrom.charCodeAt(0) - 97);
    if (fromPiece == "P")
      fromPiece = '';
    let toPiece = piecesArr[8 - parseInt(moveTo.charAt(1))].charAt(moveTo.charCodeAt(0) - 97);
    // todo: need to deal with moves that have multiple potential fromPieces
    // pseudo code
    // const piecePositions = getPositionOfPiece(fromPiece, moveFrom);
    // console.log(piecePositions);
    // const chess = new Chess(currChessBoard.fen);
    // const rawcurrGameStateidMoves: Move[] = chess.moves({
    //   square,
    //   verbose: true,
    // }) as Move[];
    // remove the fromPiece. find each piece's valid moves from contract, and check if moveTo is there.
    // if moveTo is there, 
    // if pieces are not on same file 
    // add file
    // else if pieces are not on same row
    // add row
    // else add file and row
    if (toPiece == ' ')
      return fromPiece.toUpperCase() + moveTo;
    else {
      return fromPiece.toUpperCase() + 'x' + moveTo;
    }
  }
}