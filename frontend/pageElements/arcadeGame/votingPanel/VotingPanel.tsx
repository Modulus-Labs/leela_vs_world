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

  // --- Visuals to hint at the user that they should submit a move ---
  const [submitMoveButtonAnimating, setSubmitMoveButtonAnimating] = useState<boolean>(false);
  const [buyPowerButtonAnimating, setBuyPowerButtonAnimating] = useState<boolean>(false);
  const [walletButtonAnimating, setWalletButtonAnimating] = useState<boolean>(true);
  useEffect(useCallback(() => {
    if (votingPower === 0 && !walletButtonAnimating) {
      setBuyPowerButtonAnimating(true);
    } else {
      setBuyPowerButtonAnimating(false);
    }
    if (votingPower > 0 && userVotedMove === "" && !walletButtonAnimating) {
      setSubmitMoveButtonAnimating(true);
    } else {
      setSubmitMoveButtonAnimating(false);
    }
  }, [votingPower, walletButtonAnimating, userVotedMove]), [votingPower, walletButtonAnimating, userVotedMove]);


  // --- To display error message to user ---
  const openModalWithOptions = (text: string, canDismiss: boolean) => {
    setInfoModalText(text);
    setInfoModalDismissVisible(canDismiss);
    setShowInfoModal(true);
  }

  // --- TODO(ryancao): What is this hack lol ---
  // if (leaderboardMoves.length === 0) return null;

  return (
    <div className="relative h-full w-full bg-[url(/VotingDisplay.png)] bg-contain bg-bottom bg-no-repeat"
      style={{ alignItems: "center", justifyContent: "center" }}>

      {/* --- Thingy + dropdown --- */}
      {userVotedMove === "" ?
        <div>
          <div className="absolute left-[180px] bottom-[175px]">
            <span style={{ fontSize: 20 }}>
              {`[${moveNotation === "" ? "-" : moveNotation}]`}
            </span>
          </div>

          {/* --- "with your purchased power: ___ " --- */}
          <div className="absolute right-[110px] bottom-[135px]" style={{}}>
            <span style={{ fontSize: 25, color: "white" }}>{`${votingPower}`}</span>
          </div>
        </div>
        :
        <div className="absolute left-[0px] bottom-[130px]" style={{ backgroundColor: "#ABE1BD", justifyContent: "center", flexDirection: "row" }}>
          <p style={{ fontSize: 25, paddingBottom: 10, paddingTop: 10, paddingLeft: 20, paddingRight: 20 }}>{`You voted for [${userVotedMove}] with ${votingPower} power!`}</p>
        </div>
      }

      <div className="absolute top-[90px] left-[0px] right-[0px] flex flex-col" style={{ alignItems: "center", justifyContent: "center", height: 120 }}>
        <div className="h-[50px] w-[400px]">
          <RetroButton
            animating={submitMoveButtonAnimating}
            buttonImageUrl="bg-[url(/SubmitMoveButton.svg)]"
            onClick={() => {

              // --- No wallet connect ---
              if (walletAddr === "") {
                openModalWithOptions("Oops! Gotta connect your wallet first!", true);
              }

              // --- Already voted ---
              else if (userVotedMove !== "") {
                openModalWithOptions("Oops -- already voted for a move this round!", true);
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

        <div className="h-[50px] w-[400px]">
          <RetroButton
            animating={buyPowerButtonAnimating}
            buttonImageUrl="bg-[url(/BuyPowerButton.svg)]"
            onClick={() => {
              if (walletAddr == "") {
                openModalWithOptions("Error: You must connect your wallet first!", true);
              }
              // --- Already submitted a move ---
              else if (userVotedMove !== "") {
                openModalWithOptions("Already voted for a move! Buy more power on the next turn ;)", true);
              } else {
                setShowGameDetails(true);
              }
            }}
          />
        </div>

        <div className="h-[50px] w-[400px]">
          {walletAddr === "" ?
            <RetroButton
              animating={walletButtonAnimating}
              buttonImageUrl="bg-[url(/ConnectWalletButton.svg)]"
              onClick={() => {
                connectWallet().then(({ status, address, provider }) => {
                  if (address !== null && provider !== null) {
                    openModalWithOptions("Successfully connected wallet!", true);
                    setWalletAddr(address);
                    setEthersProvider(provider);
                    setWalletButtonAnimating(false);
                  } else {
                    openModalWithOptions(status, true);
                  }
                })
              }}
            />
            :
            <>
              <span style={{ fontSize: 15 }}>{`Wallet connected: ${walletAddr}`}</span>
            </>
          }
        </div>
      </div>
    </div >
  );
};
