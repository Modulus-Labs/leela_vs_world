import { FC, useCallback, useEffect, useState } from 'react';
import { RetroButton } from './RetroButton';
import { RetroDropdown } from './RetroDropdown';
import { useChessGameContext } from '../../../contexts/ChessGameContext';
import { connectWallet } from '../../../utils/interact';
import { ethers } from 'ethers';
import { convertUint16ReprToMoveStrings, getAlgebraicNotation, getContractMoveRepr } from '../../../utils/helpers';
import { useArcadeMachineContext } from '../../../contexts/ArcadeMachineContext';
import { useBettingContext } from '../../../contexts/BettingContext';
import { useContractInteractionContext } from '../../../contexts/ContractInteractionContext';

export const VotingPanel: FC = () => {
  const { currChessBoard } = useChessGameContext();
  const { setShowGameDetails, setShowInfoModal, setInfoModalDismissVisible, setInfoModalText } = useArcadeMachineContext();
  const { bettingContractRef, walletAddr, setWalletAddr } = useContractInteractionContext();
  const { getUserStakeFromBettingContract, getUserVotedMove, voteForMove } = useBettingContext();

  // --- Sets up current move notation state ---
  // --- Updates state whenever chessboard UI state changes ---
  const [moveNotation, setMoveNotation] = useState<string>("");
  useEffect(useCallback(() => {
    setMoveNotation(getAlgebraicNotation(currChessBoard.moveFrom, currChessBoard.moveTo, currChessBoard.fen));
  }, [currChessBoard.moveFrom, currChessBoard.moveTo, currChessBoard.fen]),
    [currChessBoard.moveTo, currChessBoard.moveFrom, currChessBoard.fen]);

  // --- For voting power ---
  const [votingPower, setVotingPower] = useState<number>(0);
  useEffect(useCallback(() => {
    // --- No login --> no power ---
    if (walletAddr === "") return;

    const userStakeRequest = getUserStakeFromBettingContract();
    if (userStakeRequest !== undefined) {
      userStakeRequest.then(([leelaStake, worldStake]) => {
        console.log(`Got this from the contract: ${leelaStake} (leela), ${worldStake} (world)`)
        const parsedTotal = Number(ethers.utils.formatEther(leelaStake.add(worldStake)));
        setVotingPower(parsedTotal);
      }).catch((error) => {
        console.error(`Error from user stake request: ${error}`);
      })
    } else {
      console.error("Error: Got null from smart contract");
    }
  }, [bettingContractRef.current]), [bettingContractRef.current]);

  // --- For not allowing the user to submit another move once they've done so already ---
  // TODO(ryancao): Get this from smart contract!
  const [userVotedMove, setUserVotedMove] = useState<string>("");
  useEffect(useCallback(() => {
    if (walletAddr !== "") {
      const getUserVotedMoveRequest = getUserVotedMove();
      getUserVotedMoveRequest?.then((moveNumRepr) => {
        if (moveNumRepr === 0) {
          return;
        }
        const [moveFrom, moveTo] = convertUint16ReprToMoveStrings(moveNumRepr);
        const moveRepr = getAlgebraicNotation(moveFrom, moveTo, currChessBoard.fen);
        setUserVotedMove(moveRepr);
      });
    } else {
      setUserVotedMove("");
    }
  }, [bettingContractRef.current]), [bettingContractRef.current]);

  // --- To display error message to user ---
  const openModalWithOptions = (text: string, canDismiss: boolean) => {
    setInfoModalText(text);
    setInfoModalDismissVisible(canDismiss);
    setShowInfoModal(true);
  }

  // --- TODO(ryancao): What is this hack lol ---
  // if (leaderboardMoves.length === 0) return null;

  return (
    <div className="relative h-full w-full bg-[url(/VotingDisplay.svg)] bg-contain bg-bottom bg-no-repeat"
      style={{}}>

      {/* --- Thingy + dropdown --- */}
      {userVotedMove === "" ?
        <>
          <div className="absolute left-[180px] bottom-[247.5px]" style={{}}>
            <RetroDropdown
              text={moveNotation}
              onClick={() => {
                //todo: get valid moves from betting contract, and make the next item be the next valid move. 
                // setSelectedMoveIndex((selectedMoveIndex + 1) % validMoves.length);
                //square = new selected move

                // const newChessBoard = {
                //   ...currChessBoard,
                //   moveState: MOVE_STATE.MOVED,
                //   validMoves: null,
                //   moveTo: square,
                // } as MovedBoardState;

                // setCurrChessBoard({ ...newChessBoard });
                // 
              }}
            />
          </div>

          {/* --- "Move to ___ " --- */}
          <div className="absolute right-[100px] bottom-[247.5px]" style={{}}>
            <span>{"where you are moving to"}</span>
          </div>

          {/* --- "with your purchased power: ___ " --- */}
          <div className="absolute right-[100px] bottom-[175px]" style={{}}>
            <span style={{ fontSize: 50 }}>{`${votingPower}`}</span>
          </div>
        </>
        :
        <div className="absolute left-[0px] bottom-[180px]" style={{ backgroundColor: "#ABE1BD", justifyContent: "center", flexDirection: "row" }}>
          <p style={{ fontSize: 40, paddingRight: 20, paddingLeft: 20 }}>{`You voted for [${userVotedMove}] with ${votingPower} power!`}</p>
        </div>
      }

      <div className="absolute bottom-[20px] left-[0px] right-[0px] flex flex-col items-center gap-y-3" style={{}}>
        <div className="h-[45px] w-[545px]">
          <RetroButton
            buttonImageUrl="bg-[url(/SubmitMoveButton.svg)]"
            onClick={() => {

              // --- No wallet connect ---
              if (walletAddr === "") {
                openModalWithOptions("Oops! Gotta connect your wallet first!", true);
              }

              // --- Already voted ---
              else if (userVotedMove !== "") {
                openModalWithOptions("Oops -- already voted for a move this round! No voter fraud here, as much as we'd like to fulfill Trump's fantasies ;)", true);
              }

              // --- No move selected ---
              else if (currChessBoard.moveFrom === null || currChessBoard.moveTo === null) {
                openModalWithOptions("What? You didn't pick a move yet, you sly fox!", true);
              }

              // --- No voting power ---
              else if (votingPower === 0) {
                openModalWithOptions("You have no voting power! Gotta get some with that \"Buy Power\" button :)", true);
              }

              // --- Submit the actual move ---
              else {
                const selectedMoveRepr = getContractMoveRepr(currChessBoard.moveFrom, currChessBoard.moveTo);

                // --- TODO: call betting contract function voteWorldMove(ret) ---
                // --- TODO: Grab the actual amount of power from the betting contract ---
                const voteForMoveRequest = voteForMove(selectedMoveRepr);
                openModalWithOptions(`Submitting vote to contract -- this might take a moment...`, false);
                voteForMoveRequest?.then((_) => {
                  openModalWithOptions(`Success!! Voted for move [${moveNotation}] with ${votingPower} power.`, true);
                }).catch((error) => {
                  openModalWithOptions(`Failed to submit vote to contract. Error: ${error}`, true);
                  console.error(error);
                });
              }
            }}
          />
        </div>

        <div className="h-[45px] w-[545px]">
          <RetroButton
            buttonImageUrl="bg-[url(/BuyPowerButton.svg)]"
            onClick={() => {
              if (walletAddr == "") {
                openModalWithOptions("Error: You must connect your wallet first!", true);
              }
              // --- Already submitted a move ---
              else if (userVotedMove !== "") {
                openModalWithOptions("Already voted for a move! Buy more power before voting to give that next move some more oomph!", true);
              } else {
                setShowGameDetails(true);
              }
            }}
          />
        </div>

        <div className="h-[45px] w-[545px]">
          {walletAddr === "" ?
            <RetroButton
              buttonImageUrl="bg-[url(/ConnectWalletButton.svg)]"
              onClick={() => {
                connectWallet().then(({ status, address }) => {
                  if (address !== null) {
                    openModalWithOptions("Successfully connected wallet!", true);
                    setWalletAddr(address);
                  } else {
                    openModalWithOptions(status, true);
                  }
                })
              }}
            />
            :
            <>
              <span style={{ fontSize: 20 }}>{`Wallet connected: ${walletAddr}`}</span>
            </>
          }
        </div>
      </div>
    </div>
  );
};
