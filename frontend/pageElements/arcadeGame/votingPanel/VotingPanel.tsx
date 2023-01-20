import { FC, MouseEventHandler, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import clsx from 'clsx';
import { RetroButton } from './RetroButton';
import { RetroDropdown } from './RetroDropdown';
import { useBettingContext } from '../../../contexts/BettingContext';
import { CHESS_PLAYER } from '../../../types/Chess.type';

export const VotingPanel: FC = () => {
  const {
    playerOption,
    setPlayerOption,
    validMoves,
    selectedMoveIndex,
    setSelectedMoveIndex,
  } = useBettingContext();

  if (validMoves.length === 0) return null;

  return (
    <div className="relative h-full w-full bg-[url(/VotingDisplay.svg)] bg-contain bg-bottom bg-no-repeat">
      <div className="absolute left-[180px] bottom-[247.5px]">
        <RetroDropdown
          text={playerOption}
          onClick={() => {
            setPlayerOption(
              playerOption === CHESS_PLAYER.LEELA
                ? CHESS_PLAYER.WORLD
                : CHESS_PLAYER.LEELA
            );
          }}
        />
      </div>
      <div className="absolute right-[100px] bottom-[247.5px]">
        <RetroDropdown
          text={validMoves[selectedMoveIndex].move}
          onClick={() => {
            setSelectedMoveIndex((selectedMoveIndex + 1) % validMoves.length);
          }}
        />
      </div>
      <div className="absolute bottom-[20px] left-[0px] right-[0px] flex flex-col items-center gap-y-3">
        <div className="h-[45px] w-[545px]">
          <RetroButton
            buttonImageUrl="bg-[url(/SubmitMoveButton.svg)]"
            onClick={() => {
              console.log('Submit Move');
            }}
          />
        </div>
        <div className="h-[45px] w-[545px]">
          <RetroButton
            buttonImageUrl="bg-[url(/BuyPowerButton.svg)]"
            onClick={() => {
              console.log('Buy Power');
            }}
          />
        </div>
        <div className="h-[45px] w-[545px]">
          <RetroButton
            buttonImageUrl="bg-[url(/ConnectWalletButton.svg)]"
            onClick={() => {
              console.log('Connect Your Wallet');
            }}
          />
        </div>
      </div>
    </div>
  );
};
