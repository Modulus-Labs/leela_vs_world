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
import { Square } from 'chess.js';

export const VotingPanel: FC = () => {
  const { currChessBoard } = useChessGameContext();
  const { setShowGameDetails, setShowInfoModal, setInfoModalDismissVisible, setInfoModalText } = useArcadeMachineContext();
  const { walletAddr, setWalletAddr, setEthersProvider } = useContractInteractionContext();
  const { voteForMove, votingPower, userVotedMove } = useBettingContext();

  // --- Sets up current move notation state ---
  // --- Updates state whenever chessboard UI state changes ---
  const [moveNotation, setMoveNotation] = useState<string>("");
  useEffect(useCallback(() => {
    if (currChessBoard.moveFrom === null || currChessBoard.moveTo === null) {
      setMoveNotation("");
      return;
    }
    const algebraicNotation = getAlgebraicNotation(currChessBoard.moveFrom, currChessBoard.moveTo, currChessBoard.chessGame);
    setMoveNotation(algebraicNotation);
  }, [currChessBoard.moveFrom, currChessBoard.moveTo, currChessBoard.chessGame, currChessBoard.fen]),
    [currChessBoard.moveTo, currChessBoard.moveFrom, currChessBoard.chessGame, currChessBoard.fen]);

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
                voteForMoveRequest?.then(async (result) => {
                  openModalWithOptions(`Processing... You voted for [${moveNotation}] with ${votingPower} power.`, false);
                  await result.wait();
                  openModalWithOptions(`Success!! Voted for move [${moveNotation}] with ${votingPower} power.`, true);
                }).catch((error) => {
                  if (error.message.includes("user rejected transaction")) {
                    openModalWithOptions(`Oops -- you cancelled the transaction!`, true);
                  } else {
                    openModalWithOptions(`Failed to submit vote to contract. Error: ${error}`, true);
                  }
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
                connectWallet().then(({ status, address, provider }) => {
                  if (address !== null && provider !== null) {
                    openModalWithOptions("Successfully connected wallet!", true);
                    setWalletAddr(address);
                    setEthersProvider(provider);
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
