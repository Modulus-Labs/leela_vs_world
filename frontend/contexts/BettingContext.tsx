import { BigNumber, ethers } from 'ethers';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ChessMoveBet, ChessPlayer } from '../types/Chess.type';

interface BettingContextInterface {
  timeToNextMove: number;
  setTimeToNextMove: Dispatch<SetStateAction<number>>;

  prizePoolAmount: number;
  setPrizePoolAmount: Dispatch<SetStateAction<number>>;
  MAX_PRIZE_POOL: number;

  playerOption: ChessPlayer;
  setPlayerOption: Dispatch<SetStateAction<ChessPlayer>>;

  validMoves: ChessMoveBet[];
  selectedMoveIndex: number;
  setSelectedMoveIndex: Dispatch<SetStateAction<number>>;

  prevMove: string;
}

const BettingContext = createContext<BettingContextInterface | undefined>(
  undefined
);

const MAX_PRIZE_POOL = 10;

export const BettingContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [timeToNextMove, setTimeToNextMove] = useState(60 * 10); // seconds

  const [prizePoolAmount, setPrizePoolAmount] = useState(2);
  const [playerOption, setPlayerOption] = useState<ChessPlayer>(
    ChessPlayer.LEELA
  );

  const [initialValidMovesIsSet, setInitialValidMovesIsSet] = useState(false); // used for simulating bid changes
  const [validMoves, setValidMoves] = useState<ChessMoveBet[]>([]);
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(0);

  const [prevMove, setPrevMove] = useState('Nc6');

  // Fetch the initial set of valid moves
  useEffect(() => {
    fetchValidMoves();
  }, []);

  // Fetch the valid moves from the contract
  const fetchValidMoves = async () => {
    try {
      let newValidMoves: ChessMoveBet[];
      // TODO: interact with contract to fetch valid moves
      newValidMoves = [
        {
          move: 'Rdf8',
          amount: ethers.utils.parseEther('0.2'),
        },
        {
          move: 'Qh4e1',
          amount: ethers.utils.parseEther('0.2'),
        },
        {
          move: 'Bxe5',
          amount: ethers.utils.parseEther('0.2'),
        },
        {
          move: 'Nf3',
          amount: ethers.utils.parseEther('0.2'),
        },
      ];
      console.log('newValidMoves: ', newValidMoves);
      setValidMoves([...newValidMoves]);
      setInitialValidMovesIsSet(true);
    } catch (error) {
      console.log(error);
    }
  };

  // ---- PLACEHOLDER SIMULATIONS ----

  // Placeholder to simulate the timer until the next move
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeToNextMove((time) => (time - 1 > 0 ? time - 1 : 60 * 10));
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Placeholder to simulate changing prize pool amount
  useEffect(() => {
    const prizePoolIncrmementor = setInterval(() => {
      setPrizePoolAmount((amount) => (amount >= 10 ? 2 : amount + 0.2));
    }, 500);
    return () => clearInterval(prizePoolIncrmementor);
  }, []);

  // Placeholder to simulate the changing bids on next moves
  useEffect(() => {
    const bidInterval = setInterval(() => {
      const randomIndex = Math.floor(validMoves.length * Math.random());
      setValidMoves((currValidMoves) => {
        currValidMoves[randomIndex].amount = currValidMoves[
          randomIndex
        ].amount.add(ethers.utils.parseEther('0.5'));
        if (
          currValidMoves[randomIndex].amount.gte(ethers.utils.parseEther('5'))
        ) {
          const resetNewMoves = currValidMoves.map(({ move }) => ({
            move,
            amount: ethers.utils.parseEther('0.5'),
          }));
          return [...resetNewMoves];
        }
        currValidMoves = currValidMoves
          .sort((moveA, moveB) =>
            moveA.amount.sub(moveB.amount).gte('0') ? 1 : -1
          )
          .reverse();
        return [...currValidMoves];
      });
    }, 500);
    return () => clearInterval(bidInterval);
  }, [initialValidMovesIsSet]);

  // ----------

  return (
    <BettingContext.Provider
      value={{
        timeToNextMove,
        setTimeToNextMove,

        prizePoolAmount,
        setPrizePoolAmount,
        MAX_PRIZE_POOL,

        playerOption,
        setPlayerOption,

        validMoves,
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
