import { FC, MouseEventHandler, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import clsx from 'clsx';
import { RetroButton } from './RetroButton';
import { RetroDropdown } from './RetroDropdown';
import { useBettingContext } from '../../../contexts/BettingContext';
import { ChessPlayer } from '../../../types/Chess.type';

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
    <div className="relative h-40 w-full bg-[url(/VotingDisplay.svg)] bg-contain bg-no-repeat">
      <div className="absolute left-[5.7rem] top-2">
        <RetroDropdown
          text={playerOption}
          onClick={() => {
            setPlayerOption(
              playerOption === ChessPlayer.LEELA
                ? ChessPlayer.WORLD
                : ChessPlayer.LEELA
            );
          }}
        />
      </div>
      <div className="absolute right-12 top-2">
        <RetroDropdown
          text={validMoves[selectedMoveIndex].move}
          onClick={() => {
            setSelectedMoveIndex((selectedMoveIndex + 1) % validMoves.length);
          }}
        />
      </div>
      <div className="flex flex-col gap-y-2 pt-16">
        <div className="h-6">
          <RetroButton
            buttonImageUrl="bg-[url(/SubmitMoveButton.svg)]"
            onClick={() => {
              console.log('Submit Move');
            }}
          />
        </div>
        <div className="h-6">
          <RetroButton
            buttonImageUrl="bg-[url(/BuyPowerButton.svg)]"
            onClick={() => {
              console.log('Buy Power');
            }}
          />
        </div>
        <div className="h-6">
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
