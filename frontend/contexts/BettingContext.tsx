import { BigNumber, ethers } from 'ethers';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ChessLeaderboardMove, CHESS_PLAYER } from '../types/Chess.type';
import { dummyLeaderboardMoves } from '../utils/constants';
import { convertUint16ReprToMoveStrings, getAlgebraicNotation } from '../utils/helpers';
import { getBettingPoolStateFromBettingContract, getLastLeelaMove, getMoveLeaderboardStateFromBettingContract, getUserStakeFromBettingContract, getUserVotedMove } from '../utils/interact';
import { useChessGameContext } from './ChessGameContext';

interface BettingContextInterface {
  walletAddr: string;
  setWalletAddr: Dispatch<SetStateAction<string>>;

  timeToNextMove: number;
  setTimeToNextMove: Dispatch<SetStateAction<number>>;

  worldPrizePoolAmount: number;
  setWorldPrizePoolAmount: Dispatch<SetStateAction<number>>;
  leelaPrizePoolAmount: number;
  setLeelaPrizePoolAmount: Dispatch<SetStateAction<number>>;

  MAX_PRIZE_POOL: number;

  playerOption: CHESS_PLAYER;
  setPlayerOption: Dispatch<SetStateAction<CHESS_PLAYER>>;

  leaderboardMoves: ChessLeaderboardMove[];
  selectedMoveIndex: number;
  setSelectedMoveIndex: Dispatch<SetStateAction<number>>;

  prevMove: string;
}

const BettingContext = createContext<BettingContextInterface | undefined>(
  undefined
);

const MAX_PRIZE_POOL = 10;

/**
 * Compares two chess leaderboard moves for sorting purposes
 * @param m1 
 * @param m2 
 * @returns 
 */
function compareMoves(m1: ChessLeaderboardMove, m2: ChessLeaderboardMove): number {
  return m2.stake - m1.stake;
}

export const BettingContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {

  // --- For user wallet connect ---
  const [walletAddr, setWalletAddr] = useState<string>("");

  // --- For timer above the chessboard ---
  const [timeToNextMove, setTimeToNextMove] = useState(60 * 10);
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeToNextMove((time) => (time - 1 > 0 ? time - 1 : 60 * 10));
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // --- For prize pool bar up top ---
  // TODO(ryancao): Convert this into MATIC!
  // TODO(ryancao): Update prize pool when event is emitted!
  const [worldPrizePoolAmount, setWorldPrizePoolAmount] = useState<number>(0.001);
  const [leelaPrizePoolAmount, setLeelaPrizePoolAmount] = useState<number>(0.001);
  useEffect(useCallback(() => {
    const bettingPoolRequest = getBettingPoolStateFromBettingContract();
    if (bettingPoolRequest !== null) {
      bettingPoolRequest.then(([leelaPoolSize, worldPoolSize, timeLeft]) => {
        const parsedLeelaPrizePoolAmount = Number(ethers.utils.formatEther(leelaPoolSize));
        const parsedWorldPrizePoolAmount = Number(ethers.utils.formatEther(worldPoolSize));
        setLeelaPrizePoolAmount(parsedLeelaPrizePoolAmount);
        setWorldPrizePoolAmount(parsedWorldPrizePoolAmount);
        setTimeToNextMove(timeLeft.toNumber());
        // console.log(`From the pool state: ${parsedLeelaPrizePoolAmount}, ${parsedWorldPrizePoolAmount}, ${timeLeft.toNumber()}`);
      }).catch((error) => {
        console.error(`Got error from betting pool request: ${error}`);
      })
    } else {
      console.error("Got null from betting pool request.");
    }
  }, []), []);

  // --- To show the last played Leela move ---
  const [prevMove, setPrevMove] = useState<string>("-");
  useEffect(useCallback(() => {
    const getLeelaMoveRequest = getLastLeelaMove();
    getLeelaMoveRequest.then((leelaMove) => {
      if (leelaMove === 0) {
        return;
      }
      const [moveFrom, moveTo] = convertUint16ReprToMoveStrings(leelaMove);
      const parsedMove = getAlgebraicNotation(moveFrom, moveTo, currChessBoard.fen);
      setPrevMove(parsedMove);
    }).catch((error) => {
      console.error(error);
    });
  }, []), []);

  // --- For the move leaderboard display ---
  // const chessGameFenRef = useRef<string>("");
  const { currChessBoard } = useChessGameContext();
  const [leaderboardMoves, setLeaderboardMoves] = useState<ChessLeaderboardMove[]>([]);
  useEffect(useCallback(() => {
    const moveLeaderboardRequest = getMoveLeaderboardStateFromBettingContract();
    if (moveLeaderboardRequest !== null) {
      moveLeaderboardRequest.then(([moves, numVotesPerMove]) => {

        // --- Parse moves ---
        const newLeaderboardMoves = moves.map((move, idx) => {
          const [moveFrom, moveTo] = convertUint16ReprToMoveStrings(move);
          const parsedNumVotes = Number(ethers.utils.formatEther(numVotesPerMove[idx]));
          const moveRepr = getAlgebraicNotation(moveFrom, moveTo, currChessBoard.fen);
          // console.log(moveFrom, moveTo, moveRepr, parsedNumVotes);
          const leaderboardMove: ChessLeaderboardMove = {
            humanRepr: moveRepr,
            stake: parsedNumVotes,
            ID: idx
          };
          return leaderboardMove;
        });

        // --- Add dummy moves for pretty ---
        for (let i: number = newLeaderboardMoves.length; i < 5; ++i) {
          const dummyMove: ChessLeaderboardMove = {
            humanRepr: "-",
            stake: 0,
            ID: i,
          }
          newLeaderboardMoves.push(dummyMove);
        }

        // --- Sort and set ---
        newLeaderboardMoves.sort(compareMoves);
        setLeaderboardMoves(newLeaderboardMoves);
      })
    } else {
      console.error("Error: move leaderboard request returned null!");
    }
  }, []), []);

  // --- No clue what these are ---
  const [playerOption, setPlayerOption] = useState<CHESS_PLAYER>(
    CHESS_PLAYER.LEELA
  );
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(0);

  // const [initialValidMovesIsSet, setInitialValidMovesIsSet] = useState(false); // used for simulating bid changes

  return (
    <BettingContext.Provider
      value={{
        walletAddr,
        setWalletAddr,

        timeToNextMove,
        setTimeToNextMove,

        worldPrizePoolAmount,
        setWorldPrizePoolAmount,

        leelaPrizePoolAmount,
        setLeelaPrizePoolAmount,

        MAX_PRIZE_POOL,

        playerOption,
        setPlayerOption,

        leaderboardMoves,
        selectedMoveIndex,
        setSelectedMoveIndex,

        prevMove,
      }}
    >
      {children}
    </BettingContext.Provider>
  );
};

export const useBettingContext = (): BettingContextInterface => {
  const context = useContext(BettingContext);
  if (context === undefined) {
    throw new Error('BettingContext must be within BettingContextProvider');
  }

  return context;
};
