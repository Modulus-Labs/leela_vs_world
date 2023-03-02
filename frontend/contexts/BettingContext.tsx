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
import { convertUint16ReprToMoveStrings, getAlgebraicNotation } from '../utils/helpers';
import { useChessGameContext } from './ChessGameContext';
import { useContractInteractionContext } from './ContractInteractionContext';

interface BettingContextInterface {
  timeToNextMove: number;
  setTimeToNextMove: Dispatch<SetStateAction<number>>;

  worldPrizePoolAmount: number;
  setWorldPrizePoolAmount: Dispatch<SetStateAction<number>>;
  leelaPrizePoolAmount: number;
  setLeelaPrizePoolAmount: Dispatch<SetStateAction<number>>;

  votingPower: number;
  setVotingPower: Dispatch<SetStateAction<number>>;
  userVotedMove: string;
  setUserVotedMove: Dispatch<SetStateAction<string>>;

  MAX_PRIZE_POOL: number;

  leaderboardMoves: ChessLeaderboardMove[];
  selectedMoveIndex: number;
  setSelectedMoveIndex: Dispatch<SetStateAction<number>>;
  prevMove: string;

  // --- For displaying turn number ---
  moveNumber: number;
  setMoveNumber: Dispatch<SetStateAction<number>>;

  payoutAvailable: BigNumber;
  setPayoutAvailable: Dispatch<SetStateAction<BigNumber>>;
  showEndGameModal: boolean;
  setShowEndGameModal: Dispatch<SetStateAction<boolean>>;

  // --- Public Functions ---
  getBettingPoolStateFromBettingContract: () => Promise<[BigNumber, BigNumber, BigNumber]>;
  getMoveLeaderboardStateFromBettingContract: () => Promise<[number[], BigNumber[]]>;
  getLastLeelaMove: () => Promise<number>;

  // --- User-specific functions ---
  getUserStakeFromBettingContract: (onFinish: (leelaStake: BigNumber, worldStake: BigNumber) => void) => void;
  voteForMove: (move: number, onFinish: (result: ethers.ContractTransaction) => void, onError: (error: any) => void) => void;
  getUserVotedMove: (onFinish: (moveResult: number) => void, onError: () => void) => void;
  addStake: (amount: number, betOnLeela: boolean, onFinish: (result: ethers.ContractTransaction) => void, onError: (error: any) => void) => void;
  getAccountPayable: (onFinish: (payableAmt: BigNumber) => void, onError: (error: any) => void) => void;
  claimPayout: (onFinish: () => void, onError: (error: any) => void) => void;
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

  // --- Move number for display ---
  const [moveNumber, setMoveNumber] = useState<number>(1);
  useEffect(useCallback(() => {
    const onFinish = (receivedMoveNumber: number) => {
      setMoveNumber(receivedMoveNumber);
    }
    const onError = (error: any) => {
      console.error(error);
    }
    getMoveNumber(onFinish, onError);
  }, []), []);

  // --- For timer above the chessboard ---
  const [timeToNextMove, setTimeToNextMove] = useState(0);
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeToNextMove((time) => (time - 1 > 0 ? time - 1 : 0));
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // --- For prize pool bar up top ---
  const [worldPrizePoolAmount, setWorldPrizePoolAmount] = useState<number>(0);
  const [leelaPrizePoolAmount, setLeelaPrizePoolAmount] = useState<number>(0);

  useEffect(useCallback(() => {
    // --- Grabs betting state from contract ---
    const bettingPoolRequest = getBettingPoolStateFromBettingContract();
    if (bettingPoolRequest !== null) {
      bettingPoolRequest.then(([leelaPoolSize, worldPoolSize, timeLeft]) => {
        const parsedLeelaPrizePoolAmount = Number(ethers.utils.formatEther(leelaPoolSize));
        const parsedWorldPrizePoolAmount = Number(ethers.utils.formatEther(worldPoolSize));
        setLeelaPrizePoolAmount(parsedLeelaPrizePoolAmount);
        setWorldPrizePoolAmount(parsedWorldPrizePoolAmount);

        const secsLeft = timeLeft.toNumber();
        // --- In the Leela case ---
        if (secsLeft === 0) {
          setTimeToNextMove(3600);
        } else {
          setTimeToNextMove(timeLeft.toNumber());
        }

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
      const parsedMove = getAlgebraicNotation(moveFrom, moveTo, currChessBoard.chessGame);
      setPrevMove(parsedMove);
    }).catch((error) => {
      console.error(error);
    });
  }, []), []);

  // --- Contract-related stuff ---
  const { walletAddr, bettingContract, ethersProvider } = useContractInteractionContext();

  // --- For showing game ended modal ---
  const [payoutAvailable, setPayoutAvailable] = useState<BigNumber>(BigNumber.from(0));
  const [showEndGameModal, setShowEndGameModal] = useState<boolean>(false);
  const [leelaPreviouslyWon, setLeelaPreviouslyWon] = useState<boolean>(false);
  useEffect(useCallback(() => {
    const onFinish = (amt: BigNumber) => {
      // --- Only pop up the modal if the amount payable is greater than 0 ---
      if (amt.gt(0)) {
        setShowEndGameModal(true);
      } else {
        setShowEndGameModal(false);
      }
      setPayoutAvailable(amt);
    }
    const onError = (error: any) => {
      console.error(`Error with getAccountPayable: ${error}`);
    }
    getAccountPayable(onFinish, onError);
  }, [walletAddr]), [walletAddr]);

  // --- For voting power ---
  const [votingPower, setVotingPower] = useState<number>(0);
  useEffect(useCallback(() => {
    // --- No login --> no power ---
    if (walletAddr === "") return;
    const onFinish = (leelaStake: BigNumber, worldStake: BigNumber) => {
      const parsedTotal = Number(ethers.utils.formatEther(leelaStake.add(worldStake)));
      setVotingPower(parsedTotal);
    }
    getUserStakeFromBettingContract(onFinish);

  }, [bettingContract]), [bettingContract]);

  // --- For the move leaderboard display ---
  const { currChessBoard } = useChessGameContext();
  const [leaderboardMoves, setLeaderboardMoves] = useState<ChessLeaderboardMove[]>([]);

  const getLeaderboardMoveFn = () => {
    const moveLeaderboardRequest = getMoveLeaderboardStateFromBettingContract();
    if (moveLeaderboardRequest !== null) {
      moveLeaderboardRequest.then(([moves, numVotesPerMove]) => {

        // --- Parse moves ---
        const newLeaderboardMoves = moves.map((move, idx) => {
          const [moveFrom, moveTo] = convertUint16ReprToMoveStrings(move);
          console.log(`Got a new leaderboard move: ${moveFrom}, ${moveTo}, ${currChessBoard.fen}`);
          const parsedNumVotes = Number(ethers.utils.formatEther(numVotesPerMove[idx]));
          const moveRepr = getAlgebraicNotation(moveFrom, moveTo, currChessBoard.chessGame);
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
  }
  useEffect(useCallback(getLeaderboardMoveFn, [currChessBoard]), [currChessBoard]);

  // --- Whichever move the user has already potentially voted for ---
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(0);

  // --- Listener stuff ---
  useEffect(useCallback(() => {
    console.log("Using the callback to assign a new listener for bettingContractRef!");
    bettingContract.removeAllListeners();

    // --- Some user added stake to the pool ---
    bettingContract.on(bettingContract.filters.stakeMade(), async function (player, amt, leelaSide) {
      console.log(`We just saw a new stake made from player ${player} with amount ${amt} on side ${leelaSide}`);
      const parsedMaticAmt = Number(ethers.utils.formatEther(amt.toHexString()));
      // console.log(`Parsed matic amount: ${Number(parsedMaticAmt)}`);
      if (leelaSide) {
        // console.log("Updating the leela prize pool");
        setLeelaPrizePoolAmount(leelaPrizePoolAmount + parsedMaticAmt);
      } else {
        // console.log("Updating the world prize pool");
        setWorldPrizePoolAmount(worldPrizePoolAmount + parsedMaticAmt);
      }
      // --- If it's us, update the amount of power we display ---
      // console.log(`For staking. Player is ${player.toLowerCase()} and walletAddr is ${walletAddr.toLowerCase()}`);
      if (player.toLowerCase() === walletAddr.toLowerCase()) {
        // console.log("Yes we're actually here");
        setVotingPower((curVotingPower) => {
          return curVotingPower + parsedMaticAmt;
        })
      }
    });

    // --- Some user voted for a move ---
    bettingContract.on(bettingContract.filters.voteMade(), async function (player, power, move) {
      console.log(`We just saw a new vote made from player ${player} on move ${move} with power ${power}`);

      // --- Just lazily requesting it again from the contract ---
      // getLeaderboardMoveFn();

      // --- Manually updating the current leaderboard ---
      const [moveFrom, moveTo] = convertUint16ReprToMoveStrings(move);
      console.log(moveFrom, moveTo);
      const leaderboardMoveRepr = getAlgebraicNotation(moveFrom, moveTo, currChessBoard.chessGame);
      const parsedPower = Number(ethers.utils.formatEther(power.toHexString()));

      // --- Update the leaderboard ---
      let foundIdx = -1;
      for (let i = 0; i < leaderboardMoves.length; ++i) {
        if (leaderboardMoves[i].humanRepr === leaderboardMoveRepr) {
          foundIdx = i;
          break;
        }
      }

      // --- If the current move already exists there ---
      if (foundIdx >= 0) {
        console.log("Move already exists! Updating leaderboard now");
        setLeaderboardMoves((curLeaderboardMoves) => {
          curLeaderboardMoves[foundIdx].stake += parsedPower;
          return curLeaderboardMoves;
        });
      }

      // --- Otherwise, add it ---
      else {
        console.log("Move doesn't yet exist! Updating leaderboard now");
        const newLeaderboardMove: ChessLeaderboardMove = {
          humanRepr: leaderboardMoveRepr,
          stake: parsedPower,
          ID: leaderboardMoves.length,
        }
        setLeaderboardMoves((curLeaderboardMoves) => {
          curLeaderboardMoves = curLeaderboardMoves.concat([newLeaderboardMove]);
          curLeaderboardMoves.sort(compareMoves);
          return curLeaderboardMoves;
        });
      }

      // --- If it's us, update the move we voted for ---
      console.log(`Okay hang on now. Player is ${player.toLowerCase()} and walletAddr is ${walletAddr.toLowerCase()}`);
      if (player.toLowerCase() === walletAddr.toLowerCase()) {
        console.log(`Just voted! Setting our selected move to ${leaderboardMoveRepr}`);
        setUserVotedMove(leaderboardMoveRepr);
      }

    });

    // --- Leela just played a move! Reset all our stuff ---
    bettingContract.on(bettingContract.filters.leelaMovePlayed(), (leelaMove) => {
      console.log(`Leela just played a move! Move: ${leelaMove}`);
      // --- Grab the move leaderboard again ---
      getLeaderboardMoveFn();
      // --- Also reset what we voted for ---
      setUserVotedMove("");
      // --- Grabs betting state from contract ---
      const bettingPoolRequest = getBettingPoolStateFromBettingContract();
      if (bettingPoolRequest !== null) {
        bettingPoolRequest.then(([_, __, timeLeft]) => {
          setTimeToNextMove(timeLeft.toNumber());
          // console.log(`From the pool state: ${parsedLeelaPrizePoolAmount}, ${parsedWorldPrizePoolAmount}, ${timeLeft.toNumber()}`);
        }).catch((error) => {
          console.error(`Got error from betting pool request: ${error}`);
        })
      } else {
        console.error("Got null from betting pool request.");
      }

      // --- Increment the move number ---
      setMoveNumber((cur) => cur + 1);
    });

    // --- World move played; increment move number ---
    bettingContract.on(bettingContract.filters.worldMovePlayed(), (worldMove) => {
      console.log(`The world just played a move! Move: ${worldMove}`);
      // --- Increment the move number ---
      setMoveNumber((cur) => cur + 1);
    });

    // --- Listen for game ended ---
    bettingContract.on(bettingContract.filters.gameEnd(), (leelaWon) => {
      console.log(`Game ended! ${leelaWon ? "Leela" : "The World"} won!`);
      const onFinish = (payableAmt: BigNumber) => {
        setPayoutAvailable(payableAmt);
        setShowEndGameModal(true);
      }
      const onError = (error: any) => {
        console.error(error);
      }
      getAccountPayable(onFinish, onError);
    });

  }, [bettingContract]), [bettingContract]);

  // --- For not allowing the user to submit another move once they've done so already ---
  const [userVotedMove, setUserVotedMove] = useState<string>("");
  useEffect(useCallback(() => {
    if (walletAddr !== "") {
      const onFinish = (moveNumRepr: number) => {
        if (moveNumRepr === 0) {
          return;
        }
        const [moveFrom, moveTo] = convertUint16ReprToMoveStrings(moveNumRepr);
        const moveRepr = getAlgebraicNotation(moveFrom, moveTo, currChessBoard.chessGame);
        setUserVotedMove(moveRepr);
      };
      const onError = () => {
        setUserVotedMove("");
      }
      getUserVotedMove(onFinish, onError);
    }
  }, [bettingContract]), [bettingContract]);

  /**
   * Grabs the pool state + timer from the betting contract.
   * This does NOT require the user to be logged in!
   */
  const getBettingPoolStateFromBettingContract = (): Promise<[BigNumber, BigNumber, BigNumber]> => {
    const bettingGamePoolRequest = bettingContract.getFrontEndPoolState();
    return bettingGamePoolRequest;
  }

  /**
   * Grabs the move leaderboard + number of votes from the betting contract.
   * This does NOT require the user to be logged in!
   * @returns 
   */
  const getMoveLeaderboardStateFromBettingContract = (): Promise<[number[], BigNumber[]]> => {
    const bettingGamePoolRequest = bettingContract.getCurMovesAndVotes();
    return bettingGamePoolRequest;
  }

  /**
   * Returns Leela's last move played (or 0 if none)
   * @returns 
   */
  const getLastLeelaMove = (): Promise<number> => {
    const leelaLastMoveRequest = bettingContract.leelaMove();
    return leelaLastMoveRequest;
  }

  /**
   * Grabs move index as a field from the betting contract (lol)
   * @param onFinish 
   * @param onError 
   * @returns 
   */
  const getMoveNumber = (onFinish: (moveNumber: number) => void, onError: (error: any) => void): void => {
    bettingContract.moveIndex().then((result) => {
      onFinish(result);
    }).catch((error) => {
      onError(error);
    })
  }

  // ------------------------ USER-SPECIFIC FUNCTIONS ------------------------

  /**
   * Grabs the user's Leela and world stakes. This requires the user to be logged in!
   * @returns 
   */
  const getUserStakeFromBettingContract = (onFinish: (leelaStake: BigNumber, worldStake: BigNumber) => void): void => {
    if (walletAddr === "") return;
    bettingContract.estimateGas.getUserStakeState(walletAddr).then((estimatedGas) => {
      bettingContract.getUserStakeState(walletAddr, { gasLimit: estimatedGas.mul(2) }).then(([leelaStake, worldStake]) => {
        onFinish(leelaStake, worldStake);
      })
    })
  }

  /**
   * Votes on the given move by the user.
   * TODO(ryancao): Is this maxPriorityFeePerGas and maxFeePerGas correct on Polygon???
   * @param move 
   * @returns 
   */
  const voteForMove = (move: number, onFinish: (result: ethers.ContractTransaction) => void, onError: (error: any) => void) => {
    if (walletAddr === "") return;
    ethersProvider.getFeeData().then((feeData) => {
      bettingContract.estimateGas.voteWorldMove(move).then((gasLimit) => {
        bettingContract.voteWorldMove(move, { maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 1e10, maxFeePerGas: feeData.maxFeePerGas || 1e11, gasLimit: gasLimit }).then((result) => {
          onFinish(result);
        }).catch((error) => {
          onError(error);
        });
      });
    });
  }

  /**
   * Returns which move user voted for this round (or 0 if none)
   * @returns 
   */
  const getUserVotedMove = (onFinish: (moveResult: number) => void, onError: () => void): void => {
    if (walletAddr === "") return;
    bettingContract.estimateGas.userVotedMove().then((estimatedGas) => {
      bettingContract.userVotedMove({ gasLimit: estimatedGas.mul(2) }).then((result) => {
        onFinish(result);
      }).catch(() => {
        onError();
      })
    });
  }

  /**
   * Buys power, staking on either Leela/World winning.
   * @param amount 
   * @param betOnLeela 
   * @returns 
   */
  const addStake = (amount: number, betOnLeela: boolean, onFinish: (result: ethers.ContractTransaction) => void, onError: (error: any) => void) => {
    if (walletAddr === "") return;
    bettingContract.estimateGas.addStake(betOnLeela, { value: ethers.utils.parseEther(`${amount}`) }).then((estimatedGas) => {
      bettingContract.addStake(betOnLeela, { gasLimit: estimatedGas.mul(2), value: ethers.utils.parseEther(`${amount}`) }).then((result) => {
        onFinish(result);
      }).catch((error) => {
        onError(error);
      })
    });
  }

  /**
   * @param onFinish 
   * @param onError 
   */
  const getAccountPayable = (onFinish: (payableAmt: BigNumber) => void, onError: (error: any) => void): void => {
    if (walletAddr === "") return;
    // console.log("Got here! 1");
    bettingContract.estimateGas.accountsPayable(walletAddr).then((estimatedGas) => {
      // console.log("Got here! 2");
      bettingContract.accountsPayable(walletAddr, { gasLimit: estimatedGas.mul(2) }).then((payableAmt) => {
        onFinish(payableAmt);
      }).catch((error) => {
        onError(error);
      });
    });
  }

  /**
   * Allows the user to claim their stake payout.
   * @param onFinish 
   * @param onError 
   */
  const claimPayout = (onFinish: () => void, onError: (error: any) => void): void => {
    if (walletAddr === "") return;
    bettingContract.estimateGas.claimPayout().then((estimatedGas) => {
      bettingContract.claimPayout({ gasLimit: estimatedGas.mul(2) }).then((receipt) => {
        receipt.wait().then(() => {
          onFinish();
        })
      }).catch((error) => {
        onError(error);
      });
    });
  }

  return (
    <BettingContext.Provider
      value={{
        // --- Stateful things ---
        moveNumber,
        setMoveNumber,
        timeToNextMove,
        setTimeToNextMove,
        worldPrizePoolAmount,
        setWorldPrizePoolAmount,
        leelaPrizePoolAmount,
        setLeelaPrizePoolAmount,
        MAX_PRIZE_POOL,
        leaderboardMoves,
        selectedMoveIndex,
        setSelectedMoveIndex,
        prevMove,
        votingPower,
        setVotingPower,
        userVotedMove,
        setUserVotedMove,
        showEndGameModal,
        setShowEndGameModal,
        payoutAvailable,
        setPayoutAvailable,

        // --- Public Functions ---
        getBettingPoolStateFromBettingContract,
        getMoveLeaderboardStateFromBettingContract,
        getLastLeelaMove,

        // --- User-specific functions ---
        getUserStakeFromBettingContract,
        voteForMove,
        getUserVotedMove,
        addStake,
        claimPayout,
        getAccountPayable,
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
